#!/bin/bash
set -e

echo "Starting StudySpace Backend..."

# Wait for database to be ready (if using PostgreSQL)
if [ -n "$DATABASE_URL" ]; then
    echo "Waiting for database to be ready..."
    python << END
import asyncio
import time
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings

async def wait_for_db():
    engine = create_async_engine(settings.database_url, echo=False)
    max_retries = 30
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            async with engine.connect() as conn:
                await conn.execute("SELECT 1")
            print("Database is ready!")
            await engine.dispose()
            return True
        except Exception as e:
            retry_count += 1
            print(f"Database not ready yet... ({retry_count}/{max_retries})")
            time.sleep(1)
    
    print("Failed to connect to database!")
    return False

asyncio.run(wait_for_db())
END
fi

# Run database migrations (create tables)
echo "Creating database tables..."
python << END
import asyncio
from app.database import engine, Base

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully!")

asyncio.run(create_tables())
END

# Seed database with demo data
echo "Checking if demo data needs to be seeded..."
python << END
import asyncio
from sqlalchemy.future import select
from app.database import AsyncSessionLocal
from app.models.user import User

async def check_and_seed():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        if len(users) == 0:
            print("No users found. Seeding demo data...")
            from scripts.seed import seed_data
            await seed_data()
            print("Demo data seeded successfully!")
        else:
            print(f"Database already has {len(users)} users. Skipping seed.")

asyncio.run(check_and_seed())
END

echo "Starting FastAPI server..."
# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
