# System design docs

[Combined HTML handbook](system-design-handbook.html) · [Topic PDFs](pdfs/README.md)

| Lesson | Topic |
| --- | --- |
| 001 | [Cache-aside](lessons/0001-cache-aside.html) |
| 002 | [Horizontal scaling](lessons/0002-horizontal-scaling.html) |
| 003 | [Vertical scaling](lessons/0003-vertical-scaling.html) |
| 004 | [Load balancing](lessons/0004-load-balancing.html) |
| 005 | [Message queues](lessons/0005-message-queues.html) |
| 006 | [Zero-downtime database migrations](lessons/0006-zero-downtime-database-migrations.html) |
| 007 | [Database indexes](lessons/0007-database-indexes.html) |
| 008 | [Eventual consistency](lessons/0008-eventual-consistency.html) |
| 009 | [Containerization](lessons/0009-containerization.html) |
| 010 | [API pagination](lessons/0010-api-pagination.html) |
| 011 | [Observability](lessons/0011-observability.html) |
| 012 | [Rate limiting](lessons/0012-rate-limiting.html) |
| 013 | [Circuit breakers](lessons/0013-circuit-breakers.html) |
| 014 | [Cost-aware architecture](lessons/0014-cost-aware-architecture.html) |

This category preserves the current system-design lesson collection and supporting assets. The Python builder can regenerate the combined HTML handbook:

```sh
python3 scripts/build_handbook.py
```

The topic PDF exporter and automatic publishing are not configured yet.
