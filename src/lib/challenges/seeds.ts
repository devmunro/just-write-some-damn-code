import type { ChallengeSeed, DsaSubcategory, PracticeCategory } from '$lib/domain/types';

/**
 * Curated scenario seeds keep the product anchored in realistic engineering
 * practice while still letting the model vary details and wording.
 */
const dsaSeeds: Record<DsaSubcategory, ChallengeSeed[]> = {
  'Arrays & Strings': [
    {
      title: 'Normalize event logs',
      scenario: 'Clean and transform a stream of strings so repeated separators and whitespace collapse predictably.',
      concepts: ['string processing', 'linear scans'],
      difficulty: 'Beginner',
      subcategory: 'Arrays & Strings'
    },
    {
      title: 'Maximum subarray window',
      scenario: 'Work with a numeric array and identify the best contiguous segment under a rule.',
      concepts: ['prefix sums', 'window reasoning'],
      difficulty: 'Intermediate',
      subcategory: 'Arrays & Strings'
    }
  ],
  'Hash Maps': [
    {
      title: 'Duplicate session cleanup',
      scenario: 'Track first-seen and repeated items in an event stream efficiently.',
      concepts: ['hash maps', 'counts'],
      difficulty: 'Beginner',
      subcategory: 'Hash Maps'
    },
    {
      title: 'Anagram grouping',
      scenario: 'Group values that share the same multiset of characters or keys.',
      concepts: ['hashing', 'canonical representation'],
      difficulty: 'Intermediate',
      subcategory: 'Hash Maps'
    }
  ],
  'Two Pointers': [
    {
      title: 'Pair sum scan',
      scenario: 'Find matching pairs in a sorted sequence with minimal extra memory.',
      concepts: ['two pointers', 'sorted arrays'],
      difficulty: 'Beginner',
      subcategory: 'Two Pointers'
    },
    {
      title: 'Remove overlapping noise',
      scenario: 'Use opposite-direction scanning to compress or compare two ends of a sequence.',
      concepts: ['in-place mutation', 'boundary conditions'],
      difficulty: 'Intermediate',
      subcategory: 'Two Pointers'
    }
  ],
  'Sliding Window': [
    {
      title: 'Rolling activity window',
      scenario: 'Track counts over the latest `k` events and update results as the window moves.',
      concepts: ['queues', 'window maintenance'],
      difficulty: 'Intermediate',
      subcategory: 'Sliding Window'
    },
    {
      title: 'Longest stable segment',
      scenario: 'Find the longest range that satisfies a constraint while expanding and shrinking efficiently.',
      concepts: ['moving windows', 'frequency tracking'],
      difficulty: 'Intermediate',
      subcategory: 'Sliding Window'
    }
  ],
  'Stack & Queue': [
    {
      title: 'Balanced expression checker',
      scenario: 'Validate nested delimiters and explain the first mismatch if one appears.',
      concepts: ['stack', 'parsing'],
      difficulty: 'Beginner',
      subcategory: 'Stack & Queue'
    },
    {
      title: 'Task scheduler buffer',
      scenario: 'Handle work items in order while preserving a strict processing discipline.',
      concepts: ['queue', 'ordering'],
      difficulty: 'Intermediate',
      subcategory: 'Stack & Queue'
    }
  ],
  'Linked Lists': [
    {
      title: 'Merge sorted feeds',
      scenario: 'Combine several sorted linked lists into a single ordered output.',
      concepts: ['list traversal', 'pointers'],
      difficulty: 'Intermediate',
      subcategory: 'Linked Lists'
    },
    {
      title: 'Detect cycle in routing data',
      scenario: 'Determine whether a linked structure contains a loop and identify the entry point.',
      concepts: ['fast/slow pointers', 'cycles'],
      difficulty: 'Intermediate',
      subcategory: 'Linked Lists'
    }
  ],
  Trees: [
    {
      title: 'Directory depth analysis',
      scenario: 'Traverse a hierarchical tree and compute aggregate information about each level.',
      concepts: ['DFS', 'tree traversal'],
      difficulty: 'Intermediate',
      subcategory: 'Trees'
    },
    {
      title: 'Lowest common ancestor drill',
      scenario: 'Find the shared ancestor of two nodes in a tree with clear boundary rules.',
      concepts: ['binary trees', 'recursion'],
      difficulty: 'Intermediate',
      subcategory: 'Trees'
    }
  ],
  Graphs: [
    {
      title: 'Dependency resolution',
      scenario: 'Order tasks with prerequisites and reject cycles cleanly.',
      concepts: ['topological sort', 'cycle detection'],
      difficulty: 'Intermediate',
      subcategory: 'Graphs'
    },
    {
      title: 'Shortest route finder',
      scenario: 'Compute a cheapest path between services connected in a weighted network.',
      concepts: ['BFS', 'Dijkstra'],
      difficulty: 'Advanced',
      subcategory: 'Graphs'
    }
  ],
  Heaps: [
    {
      title: 'Top-k live metrics',
      scenario: 'Continuously track the largest `k` values from a stream of measurements.',
      concepts: ['priority queues', 'ordering'],
      difficulty: 'Intermediate',
      subcategory: 'Heaps'
    },
    {
      title: 'Priority work scheduler',
      scenario: 'Process jobs by priority while allowing updates to the queue.',
      concepts: ['heap operations', 'state updates'],
      difficulty: 'Advanced',
      subcategory: 'Heaps'
    }
  ],
  'Dynamic Programming': [
    {
      title: 'Minimal edit cost',
      scenario: 'Compute the cheapest sequence of changes needed to transform one value into another.',
      concepts: ['state definition', 'memoization'],
      difficulty: 'Intermediate',
      subcategory: 'Dynamic Programming'
    },
    {
      title: 'Partition planning',
      scenario: 'Choose subsets or splits that maximize a score under constraints.',
      concepts: ['subproblems', 'optimization'],
      difficulty: 'Advanced',
      subcategory: 'Dynamic Programming'
    }
  ],
  Backtracking: [
    {
      title: 'Combination generator',
      scenario: 'Enumerate all valid selections that satisfy a target rule.',
      concepts: ['recursive search', 'pruning'],
      difficulty: 'Intermediate',
      subcategory: 'Backtracking'
    },
    {
      title: 'Grid path explorer',
      scenario: 'Search a board for all valid paths while avoiding repeated state.',
      concepts: ['DFS', 'search space'],
      difficulty: 'Intermediate',
      subcategory: 'Backtracking'
    }
  ],
  Intervals: [
    {
      title: 'Merge deployment windows',
      scenario: 'Combine overlapping time ranges and report the consolidated schedule.',
      concepts: ['sorting', 'interval merging'],
      difficulty: 'Beginner',
      subcategory: 'Intervals'
    },
    {
      title: 'Room booking conflicts',
      scenario: 'Determine whether a set of bookings can coexist without overlap.',
      concepts: ['sweep line', 'range reasoning'],
      difficulty: 'Intermediate',
      subcategory: 'Intervals'
    }
  ],
  Greedy: [
    {
      title: 'Minimum refill stops',
      scenario: 'Choose the best local decision at each step to minimize extra operations.',
      concepts: ['local optimum', 'planning'],
      difficulty: 'Intermediate',
      subcategory: 'Greedy'
    },
    {
      title: 'Reward scheduling',
      scenario: 'Pick actions that maximize total value when future choices depend on current picks.',
      concepts: ['sorting', 'greedy selection'],
      difficulty: 'Advanced',
      subcategory: 'Greedy'
    }
  ]
};

const genericSeeds: Record<Exclude<PracticeCategory, 'LeetCode / DSA'>, ChallengeSeed[]> = {
  Build: [
    {
      title: 'Internal deployment checklist',
      scenario: 'Build a small tool for engineers to track release readiness across services.',
      concepts: ['state', 'validation', 'persistence'],
      difficulty: 'Intermediate'
    },
    {
      title: 'Incident notes workspace',
      scenario: 'Build a focused workspace for collecting timestamped notes during an outage.',
      concepts: ['forms', 'filtering', 'local data'],
      difficulty: 'Intermediate'
    },
    {
      title: 'Feature flag console',
      scenario: 'Build a compact interface to inspect and stage feature flag changes.',
      concepts: ['tables', 'confirmation flows', 'auditability'],
      difficulty: 'Advanced'
    }
  ],
  Frontend: [
    {
      title: 'Accessible bulk editor',
      scenario: 'Create a keyboard-friendly UI for editing many records without losing context.',
      concepts: ['accessibility', 'forms', 'focus management'],
      difficulty: 'Intermediate'
    },
    {
      title: 'Responsive operations dashboard',
      scenario: 'Build a dense dashboard that remains scannable on narrow screens.',
      concepts: ['responsive layout', 'tables', 'visual hierarchy'],
      difficulty: 'Intermediate'
    },
    {
      title: 'Slow network search',
      scenario: 'Design a search interface that handles latency, cancellation, and empty states.',
      concepts: ['async UI', 'debouncing', 'loading states'],
      difficulty: 'Intermediate'
    }
  ],
  Backend: [
    {
      title: 'Webhook ingestion API',
      scenario: 'Build an endpoint that receives third-party events and processes them safely.',
      concepts: ['idempotency', 'validation', 'queues'],
      difficulty: 'Intermediate'
    },
    {
      title: 'Rate-limited invite service',
      scenario: 'Implement an API for sending invites while preventing abuse and duplicates.',
      concepts: ['rate limits', 'database constraints', 'errors'],
      difficulty: 'Intermediate'
    },
    {
      title: 'Background export worker',
      scenario: 'Design a service that creates large exports without blocking requests.',
      concepts: ['jobs', 'polling', 'status models'],
      difficulty: 'Advanced'
    }
  ],
  Debugging: [
    {
      title: 'Memory growth investigation',
      scenario: 'Investigate a service whose memory usage rises after each import job.',
      concepts: ['profiling', 'hypothesis testing', 'resource cleanup'],
      difficulty: 'Advanced'
    },
    {
      title: 'Flaky checkout test',
      scenario: 'Diagnose a test that fails intermittently when run with the full suite.',
      concepts: ['test isolation', 'timing', 'shared state'],
      difficulty: 'Intermediate'
    },
    {
      title: 'Slow render path',
      scenario: 'Find the reason a frequently used page becomes sluggish with real data.',
      concepts: ['performance', 'measurement', 'rendering'],
      difficulty: 'Intermediate'
    }
  ],
  Refactoring: [
    {
      title: 'Entangled notification rules',
      scenario: 'Refactor duplicated notification logic without changing observable behavior.',
      concepts: ['tests', 'separation of concerns', 'naming'],
      difficulty: 'Intermediate'
    },
    {
      title: 'Legacy form component',
      scenario: 'Improve a large form component while preserving validation and accessibility.',
      concepts: ['component boundaries', 'state', 'regression safety'],
      difficulty: 'Intermediate'
    },
    {
      title: 'Report generator cleanup',
      scenario: 'Restructure a report pipeline that mixes data fetching, formatting, and export logic.',
      concepts: ['pure functions', 'interfaces', 'dependency boundaries'],
      difficulty: 'Advanced'
    }
  ],
  'System Design': [
    {
      title: 'Notification delivery system',
      scenario: 'Design a system for sending user notifications across email, push, and in-app channels.',
      concepts: ['queues', 'fanout', 'retries'],
      difficulty: 'Intermediate'
    },
    {
      title: 'Document collaboration service',
      scenario: 'Design collaborative editing for teams with conflict handling and offline recovery.',
      concepts: ['sync', 'conflict resolution', 'availability'],
      difficulty: 'Advanced'
    },
    {
      title: 'Audit log platform',
      scenario: 'Design a reliable audit log for customer-facing enterprise features.',
      concepts: ['immutability', 'retention', 'query patterns'],
      difficulty: 'Intermediate'
    }
  ],
  Architecture: [
    {
      title: 'Billing boundary review',
      scenario: 'Decide where billing logic should live as a product grows from one app to many services.',
      concepts: ['boundaries', 'ownership', 'trade-offs'],
      difficulty: 'Advanced'
    },
    {
      title: 'Event-driven migration',
      scenario: 'Plan how to introduce domain events into a mostly synchronous monolith.',
      concepts: ['events', 'consistency', 'migration strategy'],
      difficulty: 'Advanced'
    },
    {
      title: 'Plugin architecture',
      scenario: 'Design extension points for internal integrations without making the core brittle.',
      concepts: ['interfaces', 'versioning', 'isolation'],
      difficulty: 'Intermediate'
    }
  ],
  'Database Design': [
    {
      title: 'Multi-tenant project data',
      scenario: 'Model projects, members, roles, and invitations for a multi-tenant SaaS app.',
      concepts: ['schema design', 'constraints', 'indexes'],
      difficulty: 'Intermediate'
    },
    {
      title: 'High-volume activity feed',
      scenario: 'Design storage and query patterns for a user activity feed with filters.',
      concepts: ['indexes', 'pagination', 'denormalization'],
      difficulty: 'Advanced'
    },
    {
      title: 'Subscription lifecycle model',
      scenario: 'Model plan changes, trials, cancellations, and invoice state transitions.',
      concepts: ['state machines', 'integrity', 'history'],
      difficulty: 'Advanced'
    }
  ],
  Security: [
    {
      title: 'API authorization review',
      scenario: 'Review an API design for authorization mistakes before implementation starts.',
      concepts: ['access control', 'threat modeling', 'secure defaults'],
      difficulty: 'Intermediate'
    },
    {
      title: 'Session handling audit',
      scenario: 'Evaluate a session design for a desktop-friendly web application.',
      concepts: ['cookies', 'tokens', 'expiration'],
      difficulty: 'Intermediate'
    },
    {
      title: 'File upload threat model',
      scenario: 'Identify risks in a feature that accepts customer files and processes them asynchronously.',
      concepts: ['validation', 'sandboxing', 'storage safety'],
      difficulty: 'Advanced'
    }
  ],
  'Technical Interview Practice': [
    {
      title: 'Production trade-off discussion',
      scenario: 'Answer a prompt about choosing reliability, speed, and simplicity under deadline pressure.',
      concepts: ['communication', 'trade-offs', 'judgment'],
      difficulty: 'Intermediate'
    },
    {
      title: 'Debugging story drill',
      scenario: 'Prepare a structured explanation of a difficult bug you investigated.',
      concepts: ['STAR format', 'technical clarity', 'reflection'],
      difficulty: 'Beginner'
    },
    {
      title: 'Design critique prompt',
      scenario: 'Critique a proposed architecture and explain what you would change first.',
      concepts: ['systems thinking', 'prioritization', 'communication'],
      difficulty: 'Intermediate'
    }
  ]
};

export function chooseSeed(
  category: PracticeCategory,
  recentChallengeText: string[],
  options: {
    random?: () => number;
    dsaSubcategory?: DsaSubcategory;
  } = {}
): ChallengeSeed {
  const random = options.random ?? Math.random;
  const seeds =
    category === 'LeetCode / DSA'
      ? dsaSeeds[options.dsaSubcategory ?? 'Arrays & Strings']
      : genericSeeds[category];
  const recent = recentChallengeText.join('\n').toLowerCase();
  const freshSeeds = seeds.filter((seed) => !recent.includes(seed.title.toLowerCase()));
  const candidates = freshSeeds.length > 0 ? freshSeeds : seeds;
  const index = Math.min(Math.floor(random() * candidates.length), candidates.length - 1);
  return candidates[index];
}

export const dsaSubcategoryOptions = Object.keys(dsaSeeds) as DsaSubcategory[];
