---
name: dotnet-api-database-bootstrap
description: Ensures .NET Web APIs using Entity Framework Core automatically create and migrate the database on container startup (Docker / docker-compose).
---

# Purpose

This skill ensures that a .NET Web API project using Entity Framework Core is configured so that:

- The database is automatically created if it does not exist
- Pending EF Core migrations are applied
- The application works correctly in Docker and docker-compose environments

This pattern prevents runtime failures when a container starts without a pre-existing database.

# When To Use

Use this skill when:

- A .NET Web API uses Entity Framework Core
- The application is deployed using Docker or docker-compose
- Migrations exist or will be used
- The API must bootstrap its database automatically

# Required Implementation

## 1. Run Migrations on Application Startup

Inside `Program.cs`, add migration execution during startup.

Example:

```csharp
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}