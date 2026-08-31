# AI Sales Coach - English Sales Conversation Test Cases

## Purpose

These manual test cases are designed to evaluate whether AI Sales Coach
reacts and scores appropriately across the four representative
scenarios:

-   Cold Call
-   Hot Call
-   Direct Sales
-   Meeting

Each scenario includes a **weak**, **medium**, and **strong**
representative test. The scripts are guides for representative behavior,
not fixed dialogues. During testing, the representative should speak one
turn at a time, wait for the AI customer to respond, and adapt while
staying at the intended skill level.

## Test Matrix

  -----------------------------------------------------------------------
  \#                Scenario          Rep Level         Main Focus
  ----------------- ----------------- ----------------- -----------------
  1                 Cold Call         Weak              Early pitching,
                                                        little discovery,
                                                        poor objection
                                                        handling

  2                 Cold Call         Medium            Some discovery
                                                        and relevance,
                                                        but limited depth

  3                 Cold Call         Strong            Earn attention,
                                                        discover pain,
                                                        handle objection,
                                                        secure next step

  4                 Hot Call          Weak              Ignores prior
                                                        interest, generic
                                                        pitch, weak
                                                        business case

  5                 Hot Call          Medium            Recognizes prior
                                                        demo and explores
                                                        some needs

  6                 Hot Call          Strong            Connects needs to
                                                        measurable value
                                                        and earns
                                                        evaluation step

  7                 Direct Sales      Weak              Pushy close,
                                                        avoids commercial
                                                        and rollout
                                                        concerns

  8                 Direct Sales      Medium            Handles some
                                                        commercial
                                                        concerns but
                                                        lacks depth

  9                 Direct Sales      Strong            Reduces risk,
                                                        handles
                                                        ROI/adoption,
                                                        asks for
                                                        commitment

  10                Meeting           Weak              No agenda, talks
                                                        too much, shallow
                                                        discovery

  11                Meeting           Medium            Some structure
                                                        and discovery,
                                                        incomplete
                                                        stakeholder
                                                        alignment

  12                Meeting           Strong            Structured
                                                        discovery,
                                                        decision
                                                        criteria,
                                                        outcomes, aligned
                                                        next step
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# Cold Call

## Test 1 - Cold Call / Weak Rep

### Purpose

Verify that a weak cold call receives appropriately poor
coaching/scoring.

### Rep behavior

-   Pitch immediately.
-   Ask little or no discovery.
-   Use exaggerated AI claims.
-   Handle objections superficially.
-   Ask for a meeting before establishing a real business problem.

### Suggested rep turns

**Opening**

> Hi Sarah, I'm calling from AI Sales Coach. We have an amazing AI
> platform that can completely transform your sales team.

Wait for the AI customer to respond.

**Continue**

> Our AI can coach your reps automatically, so your managers won't need
> to spend as much time coaching them.

Wait for the response.

> We have lots of features including AI role-play, scoring and feedback.

Wait for the response.

> Would you have 30 minutes next week for a demo?

### If the customer raises objections

If the customer says the team may not adopt it:

> I'm sure your team will use it once they see how good it is.

If the customer says AI cannot replace coaching:

> It can do most of the coaching automatically and save your managers a
> lot of time.

If the customer says they already use Gong:

> Our product is better because it uses AI.

### Expected signal

The system should identify weak discovery, premature pitching, weak
objection handling, unsupported claims, and an unearned close.

------------------------------------------------------------------------

## Test 2 - Cold Call / Medium Rep

### Purpose

Test a representative who creates some relevance and asks discovery
questions but does not explore the problem deeply enough.

### Rep behavior

-   Give a relevant reason for calling.
-   Ask one or two discovery questions.
-   Acknowledge an objection.
-   Explain the product reasonably.
-   Attempt a next step without fully developing the business case.

### Suggested rep turns

**Opening**

> Hi Sarah, I'm calling because we work with sales teams that are trying
> to make coaching and role-play more consistent. I know this is a cold
> call - can I quickly ask how your team currently practices sales
> conversations?

Wait for the response.

> How much time do your managers currently spend coaching reps?

Wait for the response.

> AI Sales Coach gives reps a way to practice conversations and receive
> feedback between manager coaching sessions.

Wait for the response.

> It could reduce some of the repetitive coaching work for your
> managers.

### If the customer raises adoption concerns

> That's understandable. Adoption is important, and the idea would be to
> make practice easier for reps rather than replace what your managers
> already do.

### Close

> Would it make sense to schedule a short demo so you can see how the
> practice works?

### Expected signal

The score should be better than Test 1 because the rep establishes
relevance and performs some discovery, but it should not score as
strongly as a complete consultative cold call.

------------------------------------------------------------------------

## Test 3 - Cold Call / Strong Rep

### Purpose

Verify that strong cold-call behavior is recognized.

### Rep behavior

-   Earn attention quickly.
-   Ask relevant discovery questions before pitching deeply.
-   Explore ramp time, coaching capacity, role-play, or adoption.
-   Position AI as manager leverage rather than manager replacement.
-   Handle a meaningful objection.
-   Earn a specific next step.

### Suggested rep turns

**Opening**

> Hi Sarah, I know I'm calling out of the blue. We work with growing
> sales teams where managers are spending a lot of time repeating
> role-plays and new reps still take months to ramp. Is that at all
> relevant to your team?

Wait for the response.

> How are your managers currently handling role-play and coaching across
> the team?

Wait for the response.

> Where do you see the biggest inconsistency today - discovery,
> objection handling, or something else?

Wait for the response.

> That makes sense. The reason I asked is that AI Sales Coach is
> designed to give reps more practice between manager sessions. It isn't
> intended to replace managers; it gives them more leverage by letting
> reps practice realistic conversations and receive structured feedback.

### If the customer raises adoption concerns

> That's a fair concern. What usually determines whether your reps
> actually adopt a new enablement tool?

Wait for the answer and connect the response to the proposed evaluation.

### Close

> Based on what you've said about coaching capacity and ramp time, would
> a 30-minute evaluation next week be useful if we focus specifically on
> how a pilot could test adoption and objection-handling improvement?

### Expected signal

The system should recognize strong discovery, relevant positioning,
objection handling, and a specific next step tied to the customer's
problem.

------------------------------------------------------------------------

# Hot Call

## Test 4 - Hot Call / Weak Rep

### Purpose

Verify that treating a warm follow-up like a generic cold pitch is
recognized as weak performance.

### Rep behavior

-   Fail to acknowledge the previous demo.
-   Pitch features immediately.
-   Ask almost no questions.
-   Give vague answers about adoption and ROI.
-   Push for a pilot without a business case.

### Suggested rep turns

> Hi Jordan, I want to tell you about AI Sales Coach. It's an AI
> platform for training sales reps.

Wait for the response.

> It has role-play, scoring and AI feedback, and it can help your whole
> team perform better.

Wait for the response.

> It's easy to use, so adoption shouldn't really be a problem.

If asked how improvement is measured:

> You'll probably see your reps getting better after they use it.

### Close

> Should we just start a pilot?

### Expected signal

Low performance due to failure to acknowledge existing interest, weak
discovery, vague outcome claims, and an unearned pilot request.

------------------------------------------------------------------------

## Test 5 - Hot Call / Medium Rep

### Purpose

Test reasonable warm-call behavior with some discovery and value
discussion but incomplete business justification.

### Suggested rep turns

> Hi Jordan, thanks for taking another call after the demo. What stood
> out most to you from what you saw?

Wait for the response.

> You mentioned coaching consistency was a challenge. How are managers
> handling that today?

Wait for the response.

> AI Sales Coach could give reps more opportunities to practice between
> manager sessions and help create more consistent feedback.

If asked about adoption:

> We would want the experience to fit naturally into the team's
> workflow, and a pilot could help us see whether reps use it
> consistently.

If asked about ROI:

> We could look at things like practice activity and changes in sales
> performance over time.

### Close

> Would it make sense to continue with a pilot discussion?

### Expected signal

Moderate performance: recognizes the warm context and does discovery,
but measurable outcomes, stakeholders, and the evaluation case are not
fully developed.

------------------------------------------------------------------------

## Test 6 - Hot Call / Strong Rep

### Purpose

Verify strong warm-evaluation behavior.

### Suggested rep turns

> Hi Jordan, thanks for following up after the demo. Before we go
> deeper, what made the solution worth another conversation for you?

Wait for the response.

> You mentioned inconsistent coaching and long ramp times. Which of
> those is creating the biggest business impact right now?

Wait for the response.

> How are new reps currently onboarded, and where do managers spend the
> most coaching time?

Wait for the response.

> If this worked well, what improvement would make the investment
> meaningful - faster ramp, more consistent objection handling, more
> manager capacity, or something else?

Wait for the response.

> The goal isn't to replace your managers or your existing tools. It's
> to give reps realistic practice between coaching sessions and give
> managers a more repeatable way to identify where support is needed.

### Adoption objection

> That's important. What normally drives adoption for your team? For a
> pilot, we could agree on usage and performance measures upfront rather
> than assuming adoption.

### Close

> If we design a small pilot around the outcome you mentioned and define
> how we'll measure adoption and performance, would the right next step
> be a review with you and your VP?

### Expected signal

Strong discovery, measurable outcomes, adoption handling, appropriate
positioning, and a concrete stakeholder/evaluation step.

------------------------------------------------------------------------

# Direct Sales

## Test 7 - Direct Sales / Weak Rep

### Purpose

Verify that a pushy late-stage close without reducing commercial risk
scores poorly.

### Suggested rep turns

> Emma, you've already seen the product, so I think the next step is for
> you to buy it.

Wait for the response.

If asked about first-90-day cost:

> Pricing depends on the package, but I wouldn't worry too much about
> that yet.

If asked about manager workload:

> It shouldn't be much work.

If asked about adoption:

> Reps usually like AI tools, so I think they'll use it.

### Close

> Can I mark this as approved today?

### Expected signal

Weak commercial discovery, evasive answers, unsupported adoption claims,
and premature pressure for commitment.

------------------------------------------------------------------------

## Test 8 - Direct Sales / Medium Rep

### Purpose

Test a competent late-stage conversation that addresses some risk but
does not fully establish implementation ownership or urgency.

### Suggested rep turns

> Emma, since your managers have already seen the product, I'd like to
> make sure the business case still makes sense before we discuss a
> decision. Is onboarding consistency still the main priority?

Wait for the response.

> A pilot could give the team a controlled way to test the platform
> before a broader rollout.

If asked about adoption:

> We would track whether reps are actually practicing during the pilot
> and use that to decide whether a larger rollout makes sense.

If asked why now:

> Starting sooner would let the team begin testing the coaching process
> this quarter.

### Close

> Would you be comfortable moving forward with a pilot?

### Expected signal

Reasonable commercial handling and a clear ask, but the rep may not
fully address cost, implementation responsibilities, proof of value, and
urgency.

------------------------------------------------------------------------

## Test 9 - Direct Sales / Strong Rep

### Purpose

Verify that strong late-stage selling reduces buyer risk and earns a
concrete commitment.

### Suggested rep turns

> Emma, before we decide on the next step, I'd like to confirm the
> business case. From the earlier conversations, onboarding consistency
> and manager coaching capacity were important. Are those still the
> problems you most want to solve now?

Wait for the response.

> What would need to be true after the first 60 to 90 days for you to
> consider this successful?

Wait for the response.

If asked about manager workload:

> That's an important rollout risk. We should define exactly what
> managers need to do during the pilot and keep the process small enough
> that it doesn't create another administrative burden.

If asked about adoption:

> Rather than assume adoption, I'd suggest making it a pilot success
> metric - for example, agreed practice frequency plus improvement in
> the skills you're targeting.

If asked why now:

> If the current ramp and coaching issues are already affecting the
> team, delaying also has a cost. The question is whether a controlled
> pilot gives enough evidence to make a larger decision without taking
> unnecessary risk.

### Close

> If we agree on the pilot group, success measures, manager
> responsibilities and start date today, are you comfortable approving
> the pilot as the next step?

### Expected signal

Strong business-case confirmation, risk reduction, practical rollout
thinking, adoption/ROI handling, and a concrete commitment request.

------------------------------------------------------------------------

# Meeting

## Test 10 - Meeting / Weak Rep

### Purpose

Verify that an unstructured meeting with excessive pitching and shallow
discovery scores poorly.

### Suggested rep turns

> Hi Daniel, thanks for meeting with me. I'll start by showing you
> everything AI Sales Coach can do.

Wait for the response.

> We have AI role-play, automatic scoring, feedback and several sales
> scenarios.

Wait for the response.

> Companies can use it to improve sales performance and save managers
> time.

If challenged on priority:

> AI is becoming very important, so I think it's something companies
> need to invest in.

### Close

> Can we schedule another demo?

### Expected signal

No clear agenda, shallow discovery, generic value claims, weak strategic
reasoning, and a vague next step.

------------------------------------------------------------------------

## Test 11 - Meeting / Medium Rep

### Purpose

Test a reasonably structured meeting that discovers some priorities but
does not fully map decision criteria and stakeholders.

### Suggested rep turns

> Daniel, thanks for the time. I'd like to understand your current
> coaching priorities first, then we can look at where AI Sales Coach
> may fit. Does that work?

Wait for the response.

> What are the biggest challenges in your current coaching process?

Wait for the response.

> How important is new-hire ramp time compared with coaching
> consistency?

Wait for the response.

> AI Sales Coach could give reps more structured practice and reduce
> some repetitive coaching work for managers.

If asked about success:

> We could measure things like practice usage and improvements in key
> sales skills.

### Close

> Would a pilot design session be a reasonable next step?

### Expected signal

Good structure and some discovery, but incomplete decision criteria,
stakeholder mapping, quantified outcomes, and next-step ownership.

------------------------------------------------------------------------

## Test 12 - Meeting / Strong Rep

### Purpose

Verify strong consultative meeting behavior with structure, decision
criteria, stakeholder alignment, measurable outcomes, and a purposeful
next step.

### Suggested rep turns

> Daniel, thanks for making the time. I'd suggest we spend the first
> part understanding the revenue and coaching priorities you're trying
> to address, then look at whether AI Sales Coach fits those priorities,
> and finish by agreeing on a next step if there's a case to continue.
> Does that agenda work?

Wait for the response.

> What is creating the biggest impact today - discovery quality, ramp
> time, manager coaching capacity, or something else?

Wait for the response.

> How are you handling that problem today, and where is the current
> process falling short?

Wait for the response.

> If you invested in a solution this quarter, what outcomes would
> leadership expect to see after 30 or 60 days?

Wait for the response.

> Besides you, who would need to be comfortable with the evaluation or
> eventual rollout?

Wait for the response.

> What would those stakeholders care most about - adoption, integration
> effort, measurable performance improvement, cost, or something else?

Wait for the response.

> Based on what you've described, the relevant value isn't simply AI
> role-play. It's creating more consistent practice around the skills
> you care about while giving managers leverage without replacing their
> coaching.

### Priority objection

> That's fair. If this competes with other revenue initiatives, we'd
> need to show that the problem is important enough and that a small
> evaluation can produce evidence without creating major
> change-management work.

### Close

> Would the right next step be a pilot design session with the
> stakeholders you mentioned, where we agree on the pilot group,
> 30/60-day success measures, responsibilities and evaluation criteria?

### Expected signal

Strong agenda setting, discovery, business judgment, decision criteria,
stakeholder identification, measurable outcomes, objection handling, and
a clearly owned next step.

------------------------------------------------------------------------

# Execution Notes

For every test:

1.  Start the appropriate scenario in AI Sales Coach.
2.  Speak as the representative using the test's intended skill level.
3.  Say **one rep turn at a time**.
4.  Wait for the AI customer to respond before continuing.
5.  The AI customer's wording does not need to match any predetermined
    script.
6.  Adapt to the AI response while preserving the intended weak, medium,
    or strong behavior.
7.  Complete/end the call normally.
8.  Record the generated scorecard and coaching feedback.
9.  Compare the result with the expected signal for the test.
10. Note unexpected behavior, scoring inconsistencies, or cases where
    weak and strong conversations receive similar feedback.

## Suggested Result Log

  --------------------------------------------------------------------------
  Test        Scenario    Level        Overall Score Expected    Notes
                                                     Signal      
                                                     Matched?    
  ----------- ----------- ----------- -------------- ----------- -----------
  1           Cold Call   Weak                                   

  2           Cold Call   Medium                                 

  3           Cold Call   Strong                                 

  4           Hot Call    Weak                                   

  5           Hot Call    Medium                                 

  6           Hot Call    Strong                                 

  7           Direct      Weak                                   
              Sales                                              

  8           Direct      Medium                                 
              Sales                                              

  9           Direct      Strong                                 
              Sales                                              

  10          Meeting     Weak                                   

  11          Meeting     Medium                                 

  12          Meeting     Strong                                 
  --------------------------------------------------------------------------
