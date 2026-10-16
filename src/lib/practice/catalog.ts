import { DSA_TOPICS, type Difficulty, type ExampleCase, type Exercise, type JsonValue } from '$lib/domain/types';

type Blueprint = {
  topic: (typeof DSA_TOPICS)[number];
  name: string;
  focus: string;
  input: JsonValue;
  output: JsonValue;
  edgeInput: JsonValue;
  edgeOutput: JsonValue;
  contexts: string[];
};

const b = (topic: Blueprint['topic'], name: string, focus: string, input: JsonValue, output: JsonValue, edgeInput: JsonValue, edgeOutput: JsonValue, contexts: string[]): Blueprint => ({ topic, name, focus, input, output, edgeInput, edgeOutput, contexts });

// The catalog is independently authored. The contexts turn each core pattern
// into a distinct practice brief while retaining a clear, stable JSON contract.
const blueprints: Blueprint[] = [
  b('Arrays & Hashing','Keep first occurrences','Return the input values with later duplicates removed, preserving the first-seen order.',{values:[4,2,4,1,2] as JsonValue},[4,2,1] as JsonValue,{values:[7,7,7] as JsonValue},[7] as JsonValue,['badge identifiers','parcel codes','event keys','playlist IDs','sensor labels']),
  b('Arrays & Hashing','Count each value','Return an object mapping each distinct value, represented as a string key, to its frequency.',{values:[3,1,3,2,1,3] as JsonValue},{'1':2,'2':1,'3':3} as JsonValue,{values:[] as JsonValue},{ } as JsonValue,['inventory counts','vote totals','page visits','shoe sizes','error codes']),
  b('Arrays & Hashing','Find a target pair','Return the two indices whose values add to target. Use the first valid pair in increasing index order.',{values:[2,7,11,15] as JsonValue,target:9},[0,1] as JsonValue,{values:[3,2,4] as JsonValue,target:6},[1,2] as JsonValue,['invoice line items','sensor readings','ticket prices','checkpoint scores','supply weights']),
  b('Arrays & Hashing','Multiply all other values','For each index, return the product of every input value except the one at that index. Do not use division.',{values:[1,2,3,4] as JsonValue},[24,12,8,6] as JsonValue,{values:[0,5,2] as JsonValue},[10,0,0] as JsonValue,['daily demand','package weights','traffic counts','energy readings','team scores']),
  b('Arrays & Hashing','Longest consecutive run','Return the length of the longest run of consecutive integer values, regardless of input order.',{values:[100,4,200,1,3,2] as JsonValue},4,{values:[9,1,4,7,3,-1,0,5,8,-1,6] as JsonValue},7,['calendar days','serial numbers','floor numbers','training streaks','build sequence numbers']),

  b('Two Pointers','Pair in a sorted list','Given sorted values, return the two indices of values that add to target, or an empty array if no pair exists.',{values:[1,2,4,6,9] as JsonValue,target:8},[1,3] as JsonValue,{values:[1,3,5] as JsonValue,target:20},[] as JsonValue,['sorted invoice amounts','sorted temperatures','sorted ticket prices','sorted distances']),
  b('Two Pointers','Normalize a palindrome check','Ignore spaces, punctuation, and letter case. Return true when the remaining characters read the same both ways.',{text:'Never odd or even'},true,{text:'A man, a plan, a canal: Panama!'},true,['support notes','access phrases','message subjects','short labels']),
  b('Two Pointers','Largest container area','Treat each value as a vertical line. Return the largest area between two lines, using the shorter line as the height.',{heights:[1,8,6,2,5,4,8,3,7] as JsonValue},49,{heights:[1,1] as JsonValue},1,['water-level markers','banner poles','column heights','sensor barriers']),
  b('Two Pointers','Unique zero-sum triples','Return every unique triple that adds to zero. Sort each triple and sort the list of triples lexicographically.',{values:[-1,0,1,2,-1,-4] as JsonValue},[[-1,-1,2],[-1,0,1]] as JsonValue,{values:[0,0,0,0] as JsonValue},[[0,0,0]] as JsonValue,['temperature offsets','account adjustments','score deltas','warehouse balances']),

  b('Sliding Window','Maximum fixed-window sum','Return the largest sum of any contiguous window of exactly k values.',{values:[2,1,5,1,3,2] as JsonValue,k:3},9,{values:[-4,-2,-7] as JsonValue,k:2},-6,['hourly demand','daily temperatures','page views']),
  b('Sliding Window','Longest unique-character span','Return the length of the longest substring containing no repeated characters.',{text:'abcabcbb'},3,{text:'bbbbb'},1,['user handles','file names','search queries']),
  b('Sliding Window','Smallest covering substring','Return the shortest substring of text containing every character from target, including multiplicities. Return an empty string if none exists.',{text:'ADOBECODEBANC',target:'ABC'},'BANC',{text:'a',target:'aa'},'', ['log fragments','serial labels','message windows']),
  b('Sliding Window','Count anagram windows','Return the starting indices of all substrings of text that are anagrams of pattern, in increasing order.',{text:'cbaebabacd',pattern:'abc'},[0,6] as JsonValue,{text:'abab',pattern:'ab'},[0,1,2] as JsonValue,['event codes','search terms','short messages']),
  b('Sliding Window','Most vowels in a fixed window','Return the greatest number of vowels in any substring of length k. Treat a, e, i, o, u as vowels.',{text:'abciiidef',k:3},3,{text:'rhythms',k:4},0,['product names','route labels','short descriptions']),
  b('Sliding Window','Longest span after flips','Given a binary array and a budget k, return the longest contiguous span obtainable by changing at most k zeroes to ones.',{values:[1,1,1,0,0,0,1,1,1,1,0] as JsonValue,k:2},6,{values:[0,0,0] as JsonValue,k:0},0,['availability flags','quality checks','on-off signals']),

  b('Binary Search','First position at least target','Return the first index whose value is greater than or equal to target in a sorted array. Return the array length if none exists.',{values:[1,3,3,5,8] as JsonValue,target:3},1,{values:[2,4,6] as JsonValue,target:7},3,['sorted durations','sorted scores','sorted prices']),
  b('Binary Search','Find a value in a rotated list','Return the index of target in a rotated, strictly increasing array, or -1 when it is absent.',{values:[4,5,6,7,0,1,2] as JsonValue,target:0},4,{values:[4,5,6,7,0,1,2] as JsonValue,target:3},-1,['rotated shelf labels','rotated timestamps','rotated score boards']),
  b('Binary Search','Minimum in a rotated list','Return the smallest value in a rotated, strictly increasing array.',{values:[3,4,5,1,2] as JsonValue},1,{values:[11,13,15,17] as JsonValue},11,['shifted readings','rotated prices','rotated IDs']),
  b('Binary Search','Integer square root','Return the greatest integer whose square is less than or equal to n. Do not call a square-root library.',{n:27},5,{n:0},0,['pixel dimensions','batch sizes','storage blocks']),
  b('Binary Search','Peak index','Return any index whose value is strictly greater than its adjacent values. Treat missing neighbors as negative infinity.',{values:[1,2,3,1] as JsonValue},2,{values:[1,2,1,3,5,6,4] as JsonValue},5,['signal peaks','sales trend','mountain samples']),

  b('Stacks & Queues','Validate bracket nesting','Return true when every opening bracket has a matching closing bracket in the correct nested order.',{text:'{[()()]}'},true,{text:'([)]'},false,['template delimiters','expression brackets','config braces']),
  b('Stacks & Queues','Daily warmer-day wait','For each temperature, return how many days until a warmer value appears, or zero if there is none.',{values:[73,74,75,71,69,72,76,73] as JsonValue},[1,1,4,2,1,1,0,0] as JsonValue,{values:[30,40,50] as JsonValue},[1,1,0] as JsonValue,['daily temperatures','machine readings','queue wait times']),
  b('Stacks & Queues','Next greater value','For each value, return the first greater value to its right, or -1 if no greater value exists.',{values:[2,1,2,4,3] as JsonValue},[4,2,4,-1,-1] as JsonValue,{values:[5,4] as JsonValue},[-1,-1] as JsonValue,['task priorities','sensor peaks','stock prices']),
  b('Stacks & Queues','Evaluate reverse Polish notation','Evaluate a valid postfix expression. Division truncates toward zero.',{tokens:['2','1','+','3','*'] as JsonValue},9,{tokens:['4','13','5','/','+'] as JsonValue},6,['calculator tape','expression logs','compiled operations']),
  b('Stacks & Queues','Simplify an absolute path','Resolve dot segments and parent segments in a Unix-style absolute path; return one canonical absolute path.',{path:'/home//user/../docs/'} as JsonValue,'/home/docs',{path:'/../a/./b/../../c'} as JsonValue,'/c',['file paths','route paths','archive entries']),

  b('Linked Lists','Reverse a linked list','The list is represented by its values in order. Return those values in reverse order.',{values:[1,2,3,4] as JsonValue},[4,3,2,1] as JsonValue,{values:[] as JsonValue},[] as JsonValue,['playlist tracks','task chains','message links']),
  b('Linked Lists','Detect a cycle marker','Given next-index pointers where -1 ends the chain, return true if following from index 0 revisits an index.',{next:[1,2,3,1] as JsonValue},true,{next:[1,2,-1] as JsonValue},false,['workflow links','dependency chains','navigation nodes']),
  b('Linked Lists','Merge sorted lists','Merge two ascending arrays that represent linked lists into one ascending array.',{left:[1,2,4] as JsonValue,right:[1,3,4] as JsonValue},[1,1,2,3,4,4] as JsonValue,{left:[] as JsonValue,right:[0] as JsonValue},[0] as JsonValue,['sorted task queues','sorted event streams','sorted inventory']),
  b('Linked Lists','Remove the nth value from the end','Remove the nth item from the end of the represented list and return the remaining values.',{values:[1,2,3,4,5] as JsonValue,n:2},[1,2,3,5] as JsonValue,{values:[1] as JsonValue,n:1},[] as JsonValue,['playlist edits','task chains','request queues']),
  b('Linked Lists','Find the middle value','Return the middle value of a non-empty list. For an even number of values, return the later middle value.',{values:[1,2,3,4,5] as JsonValue},3,{values:[1,2,3,4] as JsonValue},3,['playlist tracks','ordered tasks','message links']),

  b('Trees & Tries','Level-order traversal','The binary tree uses level-order values with null placeholders. Return one array per tree level.',{tree:[3,9,20,null,null,15,7] as JsonValue},[[3],[9,20],[15,7]] as JsonValue,{tree:[] as JsonValue},[] as JsonValue,['org charts','folder trees','decision trees','team hierarchies']),
  b('Trees & Tries','Maximum tree depth','Return the number of nodes along the longest root-to-leaf path in a level-order binary tree.',{tree:[3,9,20,null,null,15,7] as JsonValue},3,{tree:[1,null,2] as JsonValue},2,['org charts','folder trees','decision trees','team hierarchies']),
  b('Trees & Tries','Check binary search ordering','Return true when the level-order tree is a valid binary search tree with strictly ordered values.',{tree:[2,1,3] as JsonValue},true,{tree:[5,1,4,null,null,3,6] as JsonValue},false,['sorted indexes','catalog trees','score trees','directory indexes']),
  b('Trees & Tries','Invert a binary tree','Return the level-order representation after swapping every node’s left and right children.',{tree:[4,2,7,1,3,6,9] as JsonValue},[4,7,2,9,6,3,1] as JsonValue,{tree:[2,1,3] as JsonValue},[2,3,1] as JsonValue,['org charts','folder trees','decision trees','team hierarchies']),
  b('Trees & Tries','Prefix dictionary lookup','Given words and prefixes, return for each prefix the alphabetically first matching word, or an empty string.',{words:['car','cart','cat','dog'] as JsonValue,prefixes:['ca','car','do','z'] as JsonValue},['car','car','dog',''] as JsonValue,{words:['apple','apply'] as JsonValue,prefixes:['app','apz'] as JsonValue},['apple',''] as JsonValue,['command names','catalog words','route names','search suggestions']),

  b('Heaps','Kth largest value','Return the kth largest value, counting duplicates as separate positions.',{values:[3,2,1,5,6,4] as JsonValue,k:2},5,{values:[3,2,3,1,2,4,5,5,6] as JsonValue,k:4},4,['job priorities','sensor readings']),
  b('Heaps','Most frequent values','Return the k most frequent values, ordered by descending frequency then ascending numeric value.',{values:[1,1,1,2,2,3] as JsonValue,k:2},[1,2] as JsonValue,{values:[4,4,2,2,1] as JsonValue,k:2},[2,4] as JsonValue,['popular routes','common error codes']),
  b('Heaps','Merge sorted streams','Merge multiple ascending lists into one ascending list.',{lists:[[1,4,5],[1,3,4],[2,6]] as JsonValue},[1,1,2,3,4,4,5,6] as JsonValue,{lists:[[],[0]] as JsonValue},[0] as JsonValue,['event streams','inventory batches']),
  b('Heaps','Assign jobs to the earliest free worker','Given worker count and job durations, return the worker index assigned to each job. Choose the lowest-index worker on ties.',{workers:2,durations:[3,2,2,1] as JsonValue},[0,1,1,0] as JsonValue,{workers:1,durations:[1,2] as JsonValue},[0,0] as JsonValue,['background jobs','build tasks']),
  b('Heaps','Closest points to the origin','Return the k points with smallest squared distance to the origin, ordered by distance then x then y.',{points:[[1,3],[-2,2],[2,-2]] as JsonValue,k:2},[[-2,2],[2,-2]] as JsonValue,{points:[[3,3],[1,1]] as JsonValue,k:1},[[1,1]] as JsonValue,['map markers','sensor locations']),
  b('Heaps','Running median','After each inserted number, return the median of all values seen so far. Use the mean of the two middle values for even counts.',{values:[5,15,1,3] as JsonValue},[5,10,5,4] as JsonValue,{values:[2,2] as JsonValue},[2,2] as JsonValue,['live metrics','streaming scores']),
  b('Heaps','Reorganize adjacent labels','Rearrange characters so no equal adjacent characters remain. Return an empty string if it is impossible.',{text:'aab'},'aba',{text:'aaab'},'', ['alert labels','task types']),

  b('Graphs','Count connected groups','Given node count and undirected edges, return the number of connected components.',{n:5,edges:[[0,1],[1,2],[3,4]] as JsonValue},2,{n:4,edges:[[0,1],[2,3]] as JsonValue},2,['device networks','friend groups','service clusters','road sections']),
  b('Graphs','Breadth-first route order','Return nodes visited by breadth-first search from start. Visit each node’s neighbors in ascending order.',{n:5,edges:[[0,1],[0,2],[1,3],[2,4]] as JsonValue,start:0},[0,1,2,3,4] as JsonValue,{n:3,edges:[[0,2],[0,1]] as JsonValue,start:0},[0,1,2] as JsonValue,['service maps','room routes','device links','course networks']),
  b('Graphs','Count land regions','In a grid of 1s and 0s, return the number of groups of adjacent 1s. Adjacency is horizontal or vertical.',{grid:[[1,1,0],[0,1,0],[1,0,1]] as JsonValue},3,{grid:[[1,1],[1,1]] as JsonValue},1,['map tiles','server racks','warehouse zones','image pixels']),
  b('Graphs','Shortest unweighted path length','Return the fewest edges from start to target in an undirected graph, or -1 if unreachable.',{n:6,edges:[[0,1],[0,2],[1,3],[2,3],[3,4]] as JsonValue,start:0,target:4},3,{n:3,edges:[[0,1]] as JsonValue,start:0,target:2},-1,['transfer routes','service calls','room connections','device networks']),
  b('Graphs','Course completion order','Given course count and prerequisite pairs [course, prerequisite], return a valid completion order or [] when a cycle makes completion impossible.',{n:4,prerequisites:[[1,0],[2,0],[3,1],[3,2]] as JsonValue},[0,1,2,3] as JsonValue,{n:2,prerequisites:[[1,0],[0,1]] as JsonValue},[] as JsonValue,['training plans','build dependencies','release steps','lesson paths']),
  b('Graphs','Clone a reachable graph','Given an adjacency list and a starting node, return the adjacency list for the reachable cloned graph with node labels preserved.',{graph:[[1,2],[0,2],[0,1]] as JsonValue,start:0},[[1,2],[0,2],[0,1]] as JsonValue,{graph:[[]] as JsonValue,start:0},[[]] as JsonValue,['service graphs','room maps','device links','social circles']),

  b('Backtracking','List all subsets','Return every subset of the input values. Sort subsets by length, then lexicographically.',{values:[1,2,3] as JsonValue},[[],[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3]] as JsonValue,{values:[0] as JsonValue},[[],[0]] as JsonValue,['feature flags','optional stops','ingredient sets','access scopes']),
  b('Backtracking','Choose a target combination','Return unique combinations of candidate values that add to target. A candidate may be used more than once; sort results lexicographically.',{candidates:[2,3,6,7] as JsonValue,target:7},[[2,2,3],[7]] as JsonValue,{candidates:[2,3,5] as JsonValue,target:8},[[2,2,2,2],[2,3,3],[3,5]] as JsonValue,['coin bundles','supply packs','score totals','ingredient measures']),
  b('Backtracking','Generate unique permutations','Return all unique permutations in lexicographic order.',{values:[1,1,2] as JsonValue},[[1,1,2],[1,2,1],[2,1,1]] as JsonValue,{values:[1,2] as JsonValue},[[1,2],[2,1]] as JsonValue,['room seating','task orders','display sequences','test permutations']),
  b('Backtracking','Place non-attacking queens','For board size n, return the number of ways to place n queens so none share a row, column, or diagonal.',{n:4},2,{n:1},1,['board layouts','robot positions','sensor placement','chess puzzles']),

  b('Dynamic Programming','Fibonacci value','Return the nth Fibonacci number with F(0)=0 and F(1)=1. The input is small enough for an integer result.',{n:8},21,{n:0},0,['growth steps','sequence terms','planning stages','sensor cycles']),
  b('Dynamic Programming','Ways to climb steps','Return the number of ways to reach step n when each move is either one or two steps.',{n:5},8,{n:1},1,['stair routes','workflow jumps','training levels','page navigation']),
  b('Dynamic Programming','Fewest coins for an amount','Return the minimum number of coins needed to make amount, or -1 when impossible. Each coin value can be reused.',{coins:[1,2,5] as JsonValue,amount:11},3,{coins:[2] as JsonValue,amount:3},-1,['cash change','token values','supply units','fare totals']),
  b('Dynamic Programming','Maximum contiguous sum','Return the greatest sum of any non-empty contiguous range.',{values:[-2,1,-3,4,-1,2,1,-5,4] as JsonValue},6,{values:[-5,-2,-8] as JsonValue},-2,['daily profit','signal strength','score streaks','temperature deltas']),
  b('Dynamic Programming','Count grid paths','Count paths from the top-left to bottom-right of a grid, moving only right or down. Cells marked 1 are blocked.',{grid:[[0,0,0],[0,1,0],[0,0,0]] as JsonValue},2,{grid:[[0,1],[0,0]] as JsonValue},1,['warehouse aisles','map routes','robot movement','screen pixels']),

  b('Greedy','Choose non-overlapping activities','Return the maximum number of non-overlapping activities. Each interval is [start,end); activities that touch may both be chosen.',{activities:[[1,3],[2,4],[3,5],[6,8]] as JsonValue},3,{activities:[[1,2],[2,3],[3,4]] as JsonValue},3,['meeting slots','machine jobs','room bookings']),
  b('Greedy','Minimum arrows for balloons','Return the minimum number of arrows needed to burst all intervals. One arrow at x covers [start,end] when start <= x <= end.',{intervals:[[10,16],[2,8],[1,6],[7,12]] as JsonValue},2,{intervals:[[1,2],[3,4]] as JsonValue},2,['package ranges','event spans','sensor windows']),
  b('Greedy','Jump to the last index','Return true when each value is the maximum forward jump from that position and the final index is reachable.',{jumps:[2,3,1,1,4] as JsonValue},true,{jumps:[3,2,1,0,4] as JsonValue},false,['checkpoint reachability','delivery routes','level progression']),
  b('Greedy','Minimum refuels to destination','Given destination, initial fuel, and [position,fuel] stations, return the fewest stops needed to reach the destination, or -1.',{target:100,startFuel:10,stations:[[10,60],[20,30],[30,30],[60,40]] as JsonValue},2,{target:100,startFuel:1,stations:[] as JsonValue},-1,['delivery range','battery charging','fuel planning']),
  b('Greedy','Assign cookies to children','Each child has a minimum size and each item has a size. Return the greatest number of children who can each receive one sufficient item.',{need:[1,2,3] as JsonValue,size:[1,1] as JsonValue},1,{need:[1,2] as JsonValue,size:[2,3] as JsonValue},2,['supply allocation','gift matching','task capacity']),

  b('Intervals','Merge overlapping ranges','Merge every overlapping or touching interval and return the result sorted by start.',{intervals:[[1,3],[2,6],[8,10],[15,18]] as JsonValue},[[1,6],[8,10],[15,18]] as JsonValue,{intervals:[[1,4],[4,5]] as JsonValue},[[1,5]] as JsonValue,['booking windows','maintenance spans','availability blocks','delivery slots']),
  b('Intervals','Insert a range','Insert a new interval into a sorted non-overlapping list, merging overlaps.',{intervals:[[1,3],[6,9]] as JsonValue,newInterval:[2,5] as JsonValue},[[1,5],[6,9]] as JsonValue,{intervals:[] as JsonValue,newInterval:[4,8] as JsonValue},[[4,8]] as JsonValue,['calendar blocks','maintenance spans','service windows']),
  b('Intervals','Remove minimum overlaps','Return the minimum number of intervals to remove so the remaining intervals do not overlap. Touching intervals are allowed.',{intervals:[[1,2],[2,3],[3,4],[1,3]] as JsonValue},1,{intervals:[[1,2],[1,2],[1,2]] as JsonValue},2,['booking windows','deployment slots','machine tasks']),
  b('Intervals','Find the next open slot','Given sorted busy intervals and a requested duration, return the earliest [start,end] free slot at or after time 0.',{busy:[[1,3],[5,8],[9,10]] as JsonValue,duration:2},[3,5] as JsonValue,{busy:[] as JsonValue,duration:4},[0,4] as JsonValue,['support shifts','maintenance slots','calendar openings']),

  b('Bit Manipulation','Count set bits','Return the number of 1 bits in the binary representation of a non-negative integer.',{n:11},3,{n:0},0,['permission masks','feature flags','sensor masks']),
  b('Bit Manipulation','Find the unpaired value','Every value appears twice except one. Return the value that appears once using constant extra space.',{values:[4,1,2,1,2] as JsonValue},4,{values:[2,2,1] as JsonValue},1,['device IDs','paired labels','duplicate checks']),
  b('Bit Manipulation','Find the missing number','Input contains distinct values from 0 through n with one missing. Return the missing value.',{values:[3,0,1] as JsonValue},2,{values:[0,1] as JsonValue},2,['sequence IDs','seat numbers','batch indexes']),
  b('Bit Manipulation','Reverse 32 bits','Reverse the order of exactly 32 binary bits and return the resulting unsigned integer.',{n:43261596},964176192,{n:0},0,['network masks','packed flags','binary fields']),

  b('Math & Geometry','Greatest common divisor','Return the greatest common divisor of two non-negative integers.',{a:48,b:18},6,{a:7,b:0},7,['tile dimensions','gear sizes','batch groupings']),
  b('Math & Geometry','Rotate a square matrix','Rotate an n by n matrix 90 degrees clockwise and return the new matrix.',{matrix:[[1,2,3],[4,5,6],[7,8,9]] as JsonValue},[[7,4,1],[8,5,2],[9,6,3]] as JsonValue,{matrix:[[1,2],[3,4]] as JsonValue},[[3,1],[4,2]] as JsonValue,['map tiles','image pixels','dashboard cells']),
  b('Math & Geometry','Closest point to origin','Return the input point with the smallest squared distance to [0,0]. On ties, choose smaller x then smaller y.',{points:[[3,4],[-1,1],[2,0]] as JsonValue},[-1,1] as JsonValue,{points:[[1,0],[-1,0]] as JsonValue},[-1,0] as JsonValue,['map markers','sensor positions','delivery coordinates']),
  b('Math & Geometry','Spiral matrix walk','Return the matrix values in clockwise spiral order, starting at the top-left corner.',{matrix:[[1,2,3],[4,5,6],[7,8,9]] as JsonValue},[1,2,3,6,9,8,7,4,5] as JsonValue,{matrix:[[1,2],[3,4]] as JsonValue},[1,2,4,3] as JsonValue,['image pixels','warehouse shelves','dashboard cells'])
];

const difficulties: Difficulty[] = Array.from({ length: 250 }, (_, index) => {
  const spread = (index * 97) % 250;
  return spread < 75 ? 'Beginner' : spread < 200 ? 'Intermediate' : 'Advanced';
});

function makeExamples(id: string, blueprint: Blueprint): ExampleCase[] {
  return [
    { id: `${id}-example-1`, label: 'Example 1', input: blueprint.input, expectedOutput: blueprint.output },
    { id: `${id}-example-2`, label: 'Example 2', input: blueprint.edgeInput, expectedOutput: blueprint.edgeOutput }
  ];
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const scenarios = blueprints.flatMap((blueprint) => blueprint.contexts.map((context, variant) => ({ blueprint, context, variant })));

export const DSA_EXERCISES: Exercise[] = scenarios.map(({ blueprint, context, variant }, index) => {
  const id = `dsa-${slug(blueprint.topic)}-${slug(blueprint.name)}-${variant + 1}`;
  return {
    id,
    kind: 'dsa',
    topic: blueprint.topic,
    title: blueprint.name,
    difficulty: difficulties[index],
    tags: [blueprint.topic, blueprint.name, context, 'JSON input/output'],
    prompt: `${blueprint.focus}\n\nImplement solve(input) and return the requested JSON value. The input object contains the named arguments shown in the examples.`,
    constraints: ['Return JSON-compatible values only.', 'Do not read from stdin or print a solution; the runner calls solve(input).', 'Aim for linear or near-linear time when the pattern allows it.'],
    examples: makeExamples(id, blueprint),
    estimatedMinutes: difficulties[index] === 'Beginner' ? 12 : difficulties[index] === 'Intermediate' ? 22 : 35
  };
});

const buildBriefs: Array<[string, string, JsonValue, JsonValue, JsonValue, JsonValue, string[], Difficulty]> = [
  ['Query string reader','Parse a URL query string into an object. Decode percent escapes, use the last value for repeated keys, and treat a key without `=` as an empty string.',{query:'?name=Jo%20Lee&mode=fast&mode=safe&flag'}, {name:'Jo Lee',mode:'safe',flag:''},{query:'?x=1&x=2'}, {x:'2'}, ['parsing','strings'],'Beginner'],
  ['CSV row summarizer','Parse a CSV document with a header row and return an array of objects. Support quoted commas and escaped double quotes.',{csv:'name,count\nAda,2\n"Lin, Jr",3'},[{name:'Ada',count:'2'},{name:'Lin, Jr',count:'3'}],{csv:'name,city\nA,"New York"'},[{name:'A',city:'New York'}],['parsing','state machines'],'Intermediate'],
  ['Access log report','Group log entries by status code and return counts sorted by numeric status code.',{lines:['GET / 200','POST /items 201','GET /missing 404','GET / 200']},[{status:200,count:2},{status:201,count:1},{status:404,count:1}],{lines:[]},[],['strings','maps'],'Beginner'],
  ['Invoice total','Return subtotal, tax, and total in cents. Apply the supplied integer tax rate in basis points and round tax to the nearest cent.',{items:[{priceCents:199,quantity:2},{priceCents:250,quantity:1}],taxBps:800},{subtotalCents:648,taxCents:52,totalCents:700},{items:[],taxBps:0},{subtotalCents:0,taxCents:0,totalCents:0},['arithmetic','rounding'],'Beginner'],
  ['Markdown heading index','Extract Markdown headings and return their depth, text, and one-based line number.',{markdown:'# Intro\nText\n## Details\n### Edge cases'},[{level:1,text:'Intro',line:1},{level:2,text:'Details',line:3},{level:3,text:'Edge cases',line:4}],{markdown:'plain text'},[],['parsing','regular expressions'],'Intermediate'],
  ['Inventory reducer','Apply add and remove events to item quantities. Ignore removals that would make a quantity negative; return item keys alphabetically.',{events:[{op:'add',item:'pen',quantity:4},{op:'remove',item:'pen',quantity:2},{op:'remove',item:'pen',quantity:5}]},{pen:2},{events:[{op:'add',item:'book',quantity:1}]},{book:1},['maps','state'],'Beginner'],
  ['Time range formatter','Merge overlapping time ranges and return compact strings in HH:MM-HH:MM format.',{ranges:[[540,600],[590,660],[720,780]]},['09:00-11:00','12:00-13:00'],{ranges:[]},[],['intervals','formatting'],'Intermediate'],
  ['Color contrast helper','Convert two six-digit hex colors to relative luminance and return the contrast ratio rounded to two decimals.',{foreground:'#000000',background:'#ffffff'},{ratio:21},{foreground:'#ffffff',background:'#ffffff'},{ratio:1},['number conversion','geometry'],'Advanced'],
  ['JSON patch applier','Apply a list of set and remove operations to a JSON object using dot-separated paths. Return the updated object.',{value:{profile:{name:'Ari',active:true}},operations:[{op:'set',path:'profile.name',value:'Rae'},{op:'remove',path:'profile.active'}]},{profile:{name:'Rae'}},{value:{a:1},operations:[{op:'set',path:'b',value:2}]},{a:1,b:2},['objects','mutation'],'Advanced'],
  ['Command option parser','Parse command tokens into an options object. Support --key value, --flag, and --no-flag forms.',{tokens:['--port','8080','--watch','--no-cache']},{port:'8080',watch:true,cache:false},{tokens:['--name','Ada']},{name:'Ada'},['parsing','state'],'Intermediate'],
  ['Search result ranker','Score documents by how many query terms appear in their title, then return IDs by descending score and ascending ID.',{query:'blue bird',documents:[{id:'b',title:'Blue bird guide'},{id:'a',title:'Bird notes'},{id:'c',title:'Blue sky'}]},['b','a','c'],{query:'x',documents:[{id:'z',title:'None'}]},['z'],['text search','sorting'],'Advanced'],
  ['Diff summary','Compare two arrays of strings and return added and removed values in original input order.',{before:['a','b','c'],after:['b','c','d']},{added:['d'],removed:['a']},{before:[],after:['new']},{added:['new'],removed:[]},['sets','arrays'],'Advanced']
];

export const BUILD_EXERCISES: Exercise[] = buildBriefs.map(([name, focus, input, output, edgeInput, edgeOutput, tags, difficulty]) => {
  const id = `build-${slug(name)}`;
  return {
    id,
    kind: 'build',
    topic: 'Single-file builds',
    title: name,
    difficulty,
    tags: [...tags, 'single-file build'],
    prompt: `${focus}\n\nBuild this as a single-file utility. Implement solve(input) -> JSON and keep the behavior deterministic.`,
    constraints: ['Use only the selected language standard library.', 'Return JSON-compatible values.', 'Keep the implementation in one file.'],
    examples: [
      { id: `${id}-example-1`, label: 'Example 1', input, expectedOutput: output },
      { id: `${id}-example-2`, label: 'Example 2', input: edgeInput, expectedOutput: edgeOutput }
    ],
    estimatedMinutes: difficulty === 'Beginner' ? 15 : difficulty === 'Intermediate' ? 25 : 40
  };
});

export const ALL_EXERCISES = [...DSA_EXERCISES, ...BUILD_EXERCISES];

export function getExercise(id: string): Exercise | undefined {
  return ALL_EXERCISES.find((exercise) => exercise.id === id);
}

export function topicsWithCounts() {
  return DSA_TOPICS.map((topic) => ({ topic, count: DSA_EXERCISES.filter((exercise) => exercise.topic === topic).length }));
}
