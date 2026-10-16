<?php
error_reporting(E_ALL);
$started = microtime(true);
$output = fopen('php://stdout', 'w');

function canonical_value($value) {
    if (is_object($value)) {
        $items = get_object_vars($value);
        ksort($items, SORT_STRING);
        $result = new stdClass();
        foreach ($items as $key => $entry) $result->{$key} = canonical_value($entry);
        return $result;
    }
    if (is_array($value)) return array_map('canonical_value', $value);
    return $value;
}

function emit_result($output, $data) {
    $encoded = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR);
    fwrite($output, "__JWS_RESULT__" . ($encoded === false ? '{"cases":[],"message":"Could not encode runner result."}' : $encoded) . "\n");
}

try {
    $cases = json_decode(file_get_contents('/workspace/cases.json'), false, 512, JSON_THROW_ON_ERROR);
    ob_start(null, 8192);
    require '/workspace/main.php';
    ob_end_clean();
    if (!function_exists('solve')) throw new RuntimeException('Define solve($input) in your file.');
} catch (Throwable $error) {
    if (ob_get_level() > 0) ob_end_clean();
    emit_result($output, ['cases' => [], 'message' => get_class($error) . ': ' . substr($error->getMessage(), 0, 500)]);
    exit(1);
}

$results = [];
foreach ($cases as $case) {
    $caseStarted = microtime(true);
    try {
        ob_start(null, 8192);
        $actual = solve($case->input);
        ob_end_clean();
        $encoded = json_encode($actual, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $actualJson = json_decode($encoded, false, 512, JSON_THROW_ON_ERROR);
        $expected = $case->expectedOutput;
        $passed = json_encode(canonical_value($actualJson), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ===
            json_encode(canonical_value($expected), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $results[] = ['id' => $case->id, 'label' => $case->label, 'passed' => $passed, 'actualOutput' => $actualJson,
            'durationMs' => (int) round((microtime(true) - $caseStarted) * 1000)];
    } catch (Throwable $error) {
        if (ob_get_level() > 0) ob_end_clean();
        $results[] = ['id' => $case->id, 'label' => $case->label, 'passed' => false,
            'error' => get_class($error) . ': ' . substr($error->getMessage(), 0, 500),
            'durationMs' => (int) round((microtime(true) - $caseStarted) * 1000)];
    }
}

emit_result($output, ['cases' => $results, 'durationMs' => (int) round((microtime(true) - $started) * 1000)]);
foreach ($results as $result) if (!$result['passed']) exit(1);
exit(0);
