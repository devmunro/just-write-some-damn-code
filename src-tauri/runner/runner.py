import contextlib
import io
import json
import sys
import time

OUTPUT = sys.stdout
MAX_CAPTURE = 8192
MAX_USER_OUTPUT = 128 * 1024


class BoundedText(io.TextIOBase):
    def __init__(self):
        self.parts = []
        self.size = 0
        self.total = 0
        self.overflow = False

    def write(self, value):
        text = str(value)
        self.total += len(text.encode('utf-8', errors='replace'))
        if self.total > MAX_USER_OUTPUT:
            self.overflow = True
        if self.size < MAX_CAPTURE:
            part = text[:MAX_CAPTURE - self.size]
            self.parts.append(part)
            self.size += len(part)
        return len(text)

    def getvalue(self):
        return ''.join(self.parts)


def canonical(value):
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value)}
    if isinstance(value, list):
        return [canonical(item) for item in value]
    return value


def main():
    started = time.monotonic()
    with open('/workspace/cases.json', encoding='utf-8') as handle:
        cases = json.load(handle)
    with open('/workspace/main.py', encoding='utf-8') as handle:
        source = handle.read()

    namespace = {'__name__': '__main__'}
    try:
        setup_out, setup_err = BoundedText(), BoundedText()
        with contextlib.redirect_stdout(setup_out), contextlib.redirect_stderr(setup_err):
            exec(compile(source, 'main.py', 'exec'), namespace, namespace)
        if setup_out.overflow or setup_err.overflow:
            raise RuntimeError('Output exceeded the 128 KB limit.')
        solve = namespace.get('solve')
        if not callable(solve):
            raise TypeError('Define solve(input) in your file.')
    except BaseException as error:
        OUTPUT.write('__JWS_RESULT__' + json.dumps({'cases': [], 'message': f'{type(error).__name__}: {error}'[:500]}) + '\n')
        return 1

    results = []
    for case in cases:
        captured_out, captured_err = BoundedText(), BoundedText()
        started_case = time.monotonic()
        try:
            with contextlib.redirect_stdout(captured_out), contextlib.redirect_stderr(captured_err):
                actual = solve(case['input'])
            if captured_out.overflow or captured_err.overflow:
                raise RuntimeError('Output exceeded the 128 KB limit.')
            encoded = json.dumps(actual, ensure_ascii=False, allow_nan=False, separators=(',', ':'))
            actual = json.loads(encoded)
            passed = canonical(actual) == canonical(case['expectedOutput'])
            row = {'id': case['id'], 'label': case['label'], 'passed': passed, 'actualOutput': actual}
        except BaseException as error:
            row = {'id': case['id'], 'label': case['label'], 'passed': False, 'error': f'{type(error).__name__}: {error}'[:500]}
        row['durationMs'] = round((time.monotonic() - started_case) * 1000)
        results.append(row)

    OUTPUT.write('__JWS_RESULT__' + json.dumps({'cases': results, 'durationMs': round((time.monotonic() - started) * 1000)}) + '\n')
    return 0 if all(case['passed'] for case in results) else 1


if __name__ == '__main__':
    sys.exit(main())
