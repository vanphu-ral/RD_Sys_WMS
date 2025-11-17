"""
Migration script to add dvt column to products_in_iwtr table
"""

import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal


async def upgrade():
    """Add dvt column to products_in_iwtr table"""
    async with AsyncSessionLocal() as session:
        # Check if dvt column already exists
        result = await session.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products_in_iwtr' AND COLUMN_NAME = 'dvt'"))
        existing_columns = [row[0] for row in result.fetchall()]

        if 'dvt' not in existing_columns:
            await session.execute(text("ALTER TABLE products_in_iwtr ADD COLUMN dvt VARCHAR(20)"))
            print("Added column 'dvt' to products_in_iwtr table")
        else:
            print("Column 'dvt' already exists in products_in_iwtr table")

        await session.commit()


if __name__ == "__main__":
    asyncio.run(upgrade())
    print("Migration completed: Added dvt column to products_in_iwtr table")