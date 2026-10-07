# Retrieval Quality

2026-07-05 · Archived lesson · Original lesson text; technical claims not rechecked

![Query: Understand the information need → Search: Find candidate passages → Rank: Prioritize useful evidence → Measure: Check relevant coverage](../assets/diagrams/0010-retrieval-quality.svg)

Figure 10. Original study diagram added on 7 October 2026 to summarize this archived lesson. Each stage follows the previous stage; review may send the task back for correction.

## <a id="lesson-10-section-1"></a>1\. What It Means

**Retrieval quality** means how well your AI system finds the right information before generating an answer.

This matters most in RAG systems.

RAG means **Retrieval-Augmented Generation**. The AI first retrieves documents, then uses them to answer.

But RAG only works well if retrieval is good.

Simple meaning:

> Retrieval quality decides whether the model gets the right evidence before it answers.

If retrieval brings the wrong documents, even a strong model may give a bad answer.

Important parts:

-   **Query:** what the user asks
-   **Documents:** the knowledge source, such as policies, help docs, contracts, tickets, code, or database records
-   **Chunks:** smaller pieces of documents used for search
-   **Embedding:** a numeric representation of text used for semantic search
-   **Ranking:** ordering search results by relevance
-   **Reranking:** a second pass that improves result order
-   **Metadata:** extra fields like date, category, customer, version, region, or access level

Retrieval quality is not only “did we find something?”

The real question is:

> Did we find the most useful, correct, current, and allowed information?

* * *

## <a id="lesson-10-section-2"></a>2\. Why It Matters In Production Systems

Many teams blame the model when the real problem is retrieval.

Example:

User asks:

> “Can I return a damaged item after opening the box?”

The model answers:

> “Opened items cannot be returned.”

That may be wrong if the damaged-item policy allows returns.

The issue may not be the model. The retrieval system may have found the normal return policy but missed the damaged-item policy.

Poor retrieval causes:

-   Wrong answers
-   Missing citations
-   Hallucinations
-   Outdated policy usage
-   Private data leaks
-   Bad customer support
-   Weak legal or compliance answers
-   Higher cost because too much irrelevant context is sent

Good retrieval improves:

-   Accuracy
-   Trust
-   Explainability
-   Lower hallucination risk
-   Lower token cost
-   Better user experience

RAG evaluation frameworks like RAGAS discuss retrieval-focused checks such as context relevance and answer grounding. Source: [https://arxiv.org/abs/2309.15217](https://arxiv.org/abs/2309.15217)

* * *

## <a id="lesson-10-section-3"></a>3\. How It Works Step By Step

Imagine a user asks:

> “What is the refund policy for damaged electronics?”

A retrieval system usually works like this:

1.  **Receive the user query**

    ```text
    What is the refund policy for damaged electronics?
    ```

2.  **Convert the query into a search form**

    The system may use embeddings, keywords, or both.

3.  **Search the index**

    The index contains chunks from company documents.

    Example chunks:

    -   General refund policy
    -   Electronics warranty policy
    -   Damaged item policy
    -   International return rules
4.  **Retrieve top results**

    Example:

    ```json
    [
      {
        "doc": "damaged_items_policy",
        "score": 0.91
      },
      {
        "doc": "electronics_warranty_policy",
        "score": 0.86
      },
      {
        "doc": "general_refund_policy",
        "score": 0.79
      }
    ]
    ```

5.  **Filter by metadata**

    Example:

    -   Region: Pakistan
    -   Product type: electronics
    -   Policy version: current
    -   Access: public support policy
6.  **Rerank results**

    A reranker may decide the damaged-item policy is more relevant than the general refund policy.

7.  **Send selected chunks to the model**

    The model receives only the most useful evidence.

8.  **Generate answer with citations**

    The model answers based on retrieved content.

9.  **Log retrieval details**

    The system records:

    -   Query
    -   Retrieved docs
    -   Scores
    -   Final selected chunks
    -   Whether the answer used them

* * *

## <a id="lesson-10-section-4"></a>4\. How To Apply It In A Project

Start by treating retrieval as its own product feature.

Do not only test the final answer.

Test whether the system found the right evidence.

A practical setup:

1.  **Create a small test set**

    Example:

    ```json
    {
      "question": "Can customers return damaged electronics?",
      "must_retrieve": ["damaged_items_policy", "electronics_return_policy"]
    }
    ```

2.  **Check top-k results**

    **Top-k** means the first `k` search results.

    Example:

    ```text
    Top 5 retrieved documents should include damaged_items_policy.
    ```

3.  **Improve document chunking**

    Bad chunk:

    ```text
    Huge 12-page policy document as one chunk.
    ```

    Better chunks:

    -   Refund eligibility
    -   Damaged items
    -   Electronics exceptions
    -   Refund timelines
    -   Required evidence
4.  **Add metadata**

    Useful metadata:

    -   Document type
    -   Policy version
    -   Date
    -   Region
    -   Product category
    -   Access level
    -   Department
    -   Customer segment
5.  **Use hybrid search when needed**

    **Hybrid search** combines semantic search and keyword search.

    Semantic search understands meaning.

    Keyword search is good for exact terms like:

    -   Product codes
    -   Error codes
    -   Contract IDs
    -   Legal clause numbers
    -   API names
6.  **Add reranking**

    Reranking is useful when initial search returns mostly correct but poorly ordered results.

7.  **Measure retrieval quality**

    Useful metrics:

    -   Did the right document appear in top 3?
    -   Did the answer use the right document?
    -   How often did retrieval return nothing?
    -   How often did it return outdated documents?
    -   How often did users downvote answers because evidence was wrong?

* * *

## <a id="lesson-10-section-5"></a>5\. Real-World Example 1: Customer Support Policy Assistant

**Use case:** An ecommerce support chatbot answers refund questions.

**User input:**

> “My laptop arrived with a cracked screen. Can I return it after opening the package?”

**Bad retrieval result:**

```json
[
  "general_return_policy",
  "opened_items_policy",
  "refund_processing_time"
]
```

**Bad answer:**

> “Opened electronics are not eligible for return.”

This answer ignores damage.

**Good retrieval result:**

```json
[
  "damaged_item_return_policy",
  "electronics_damage_exception",
  "refund_evidence_requirements"
]
```

**Good answer:**

> “Yes, damaged electronics can be returned after opening if the damage is reported within the allowed period. You may need to provide photos of the cracked screen and packaging.”

**Outcome:**

The answer is correct because retrieval found the exception policy.

**Production lesson:**

Policy exceptions are often more important than general rules.

Your retrieval system must find them.

* * *

## <a id="lesson-10-section-6"></a>6\. Real-World Example 2: Developer Documentation Assistant

**Use case:** A developer asks an internal AI assistant about deployment.

**User input:**

> “How do I deploy the frontend service?”

**Bad retrieval result:**

```json
[
  "old_deployment_notes_2023",
  "backend_deploy_script",
  "local_setup_readme"
]
```

**Bad answer:**

> “Run the old deploy command from 2023.”

This may break production.

**Good retrieval result:**

```json
[
  "frontend_deployment_runbook_current",
  "ci_cd_pipeline_docs",
  "rollback_instructions"
]
```

**Good answer:**

> “Use the current CI/CD frontend deployment workflow. The frontend deployment is handled by the pipeline, and rollback instructions are in the current runbook.”

**Outcome:**

The assistant gives safe operational guidance.

**Production lesson:**

For engineering docs, retrieval must prefer current docs over stale notes.

Metadata like `current: true`, `last_updated`, and `service: frontend` matters.

* * *

## <a id="lesson-10-section-7"></a>7\. Common Mistakes, Risks, And Trade-Offs

**Mistake 1: Bad chunking**

If chunks are too large, the model gets noise.

If chunks are too small, key context is missing.

Example:

A chunk that says:

```text
Refund is allowed only if...
```

but the condition is in the next chunk is not useful.

**Mistake 2: Only using vector similarity**

Vector search is good, but not always enough.

Exact terms matter for:

-   Error codes
-   Product IDs
-   Legal sections
-   API names
-   Invoice numbers

Use hybrid search when exact matching matters.

**Mistake 3: Ignoring metadata**

If old and new policies are both indexed, the system may retrieve outdated content.

Use metadata filters.

**Mistake 4: Returning too many chunks**

More context is not always better.

Too many chunks can confuse the model and increase cost.

**Mistake 5: No access control**

Retrieval must respect permissions.

A user should not retrieve private HR or customer data just because it matches the query.

**Mistake 6: Measuring only final answers**

If the final answer is wrong, you need to know whether the problem was:

-   Retrieval
-   Prompt
-   Model reasoning
-   Tool failure
-   Outdated source data

Test retrieval separately.

**Trade-off: Recall vs precision**

**Recall** means finding all useful documents.

**Precision** means avoiding irrelevant documents.

High recall can bring too much noise.

High precision can miss important exceptions.

Good production systems balance both.

* * *

## <a id="lesson-10-section-8"></a>8\. Practical Best Practices

1.  **Build a retrieval test set**

    For each question, define which documents should be retrieved.

2.  **Track top-k accuracy**

    Check whether the correct document appears in top 3, top 5, or top 10.

3.  **Use metadata filters**

    Filter by:

    -   User access
    -   Region
    -   Product
    -   Version
    -   Date
    -   Department
4.  **Use hybrid search for exact terms**

    Especially for technical, legal, financial, and product support systems.

5.  **Add reranking for important workflows**

    Reranking improves ordering when many results are similar.

6.  **Log retrieval results**

    Store:

    -   Query
    -   Retrieved chunks
    -   Scores
    -   Metadata filters
    -   Final chunks sent to model
7.  **Watch for stale documents**

    Add expiry rules or document versioning.

8.  **Prefer trusted sources**

    Public pages, user uploads, internal notes, and official policies should not all have the same trust level.

9.  **Connect bad answers back to retrieval**

    When users downvote answers, inspect whether the right evidence was retrieved.


* * *

## <a id="lesson-10-section-9"></a>9\. Small Practice Exercise

Imagine you are building an AI assistant for company HR policies.

User asks:

> “Can I work remotely from another country for two months?”

Design the retrieval plan.

Answer these:

1.  What documents should be retrieved?
2.  What metadata filters matter?
3.  What old or unsafe documents should be excluded?
4.  Would keyword search, vector search, or hybrid search be best?
5.  What should the assistant do if it finds conflicting policies?

A strong answer should include:

-   Remote work policy
-   International work policy
-   Tax or legal compliance policy
-   Employee region and contract type
-   Current policy version only
-   Hybrid search because exact terms like country, visa, tax, and remote work matter
-   If policies conflict, do not guess; say the policies conflict and escalate to HR
