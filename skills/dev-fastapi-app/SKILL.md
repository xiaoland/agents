---
name: develop-fastapi-app
description: Build production-ready FastAPI applications with best practices for project structure, async patterns, Pydantic models, dependency injection, database operations, and testing. Use when developing FastAPI backends, REST APIs, or Python async web services.
license: Apache-2.0
metadata:
  author: zhanymkanov, xiaoland
  version: "1.0"
---

# Developing a FastAPI Application

## When to use this skill

Use this skill when:

- Starting a new FastAPI project
- Refactoring existing FastAPI applications
- Implementing REST APIs with Python
- Working with async/await patterns in web services
- Setting up database models and migrations
- Writing tests for FastAPI endpoints
- Configuring dependency injection patterns
- Optimizing API performance and code quality

## Project Structure

Organize projects by domain rather than file type for better scalability:

```Example Structure
fastapi-project/
├── app/
│   ├── schemas/                 # data structure and constraints
│   ├── models/                  # schema with behavior
│   ├── managers/                # domain orchestrator
│   ├── exceptions/              # business exception
│   ├── routes/                  # domain orchestrator
│   ├── settings.py              # application global settings
│   ├── engine.py                # database engine
├── utils/
├── libs/
├── tests/
│   ├── conftest.py
│   ├── <by_domain>/test_<xxx>.py
├── migrations/
├── scripts/
├── docs/
├── .env
├── .env.example
├── logging.ini
├── pyproject.toml
└── run.py                       # FastAPI app
```

**File Templates**:

- [route.py](../assets/structure/route.py) - Router module with endpoints
- [schemas.py](../assets/structure/schemas.py) - Pydantic request/response schemas
- [models.py](../assets/structure/models.py) - SQLAlchemy database models
- [dependencies.py](../assets/structure/dependencies.py) - Validation dependencies
- [manager.py](../assets/structure/manager.py) - Domain orchestrator/service
- [exceptions.py](../assets/structure/exceptions.py) - Module-specific exceptions
- [run.py](../assets/structure/run.py) - Main application file
- [settings.py](../assets/structure/settings.py) - Global configuration
- [engine.py](../assets/structure/engine.py) - Database engine setup

**Notes**:

- Store all domain modules inside `app/` folder
- Each subfolder (`schemas/`, `models/`, `managers/`, `routes/`) is organized by domain
  - e.g., `app/schemas/posts.py`, `app/managers/posts_manager.py`, `app/routes/posts.py`
- Import from other packages with explicit module names

## References

Read revelant references before you really start your task:

- [API Best Practices](references/api.md)
- [Async Patterns](references/async-patterns.md)
- [Pydantic Best Practices](references/pydantic.md)
- [Dependencies Guide](references/dependencies.md)
- [Database Operations](references/database-operations.md)
- [Testing](references/testing.md)

## General Best Practices

- Use Ruff for fast linting and formatting:

```bash
ruff check --fix src
ruff format src
```
