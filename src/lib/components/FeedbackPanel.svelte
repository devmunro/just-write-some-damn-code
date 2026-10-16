<script lang="ts">
  import FeedbackList from '$lib/components/FeedbackList.svelte';
  import type { Feedback } from '$lib/domain/types';

  export let feedback: Feedback | null;
</script>

<div class="panel flex-1 rounded-md p-4">
  <p class="section-title">Feedback</p>
  {#if feedback}
    <div class="mt-3 grid gap-4">
      <FeedbackList title="Strengths" items={feedback.strengths} positive />
      <FeedbackList title="Weaknesses" items={feedback.weaknesses} />
      <FeedbackList title="Suggestions" items={feedback.suggestions} />
      <FeedbackList title="Follow-up Questions" items={feedback.followUpQuestions} />
    </div>
  {:else}
    <div class="mt-3 rounded-md border border-dashed border-line bg-raised/45 p-5 text-sm text-steel">
      Feedback appears after you submit your work.
    </div>
  {/if}
</div>
