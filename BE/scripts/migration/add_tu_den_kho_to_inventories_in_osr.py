"""
Migration script to add tu_kho and den_kho columns to products_in_osr table
"""

import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal


async def upgrade():
    """Add tu_kho and den_kho columns to products_in_osr table"""
    async with AsyncSessionLocal() as session:
        # Check if columns already exist
        result = await session.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products_in_osr' AND COLUMN_NAME IN ('tu_kho', 'den_kho')"))
        existing_columns = [row[0] for row in result.fetchall()]

        if 'tu_kho' not in existing_columns:
            await session.execute(text("ALTER TABLE products_in_osr ADD COLUMN tu_kho INTEGER"))
            print("Added column 'tu_kho' to products_in_osr table")
        else:
            print("Column 'tu_kho' already exists in products_in_osr table")

        if 'den_kho' not in existing_columns:
            await session.execute(text("ALTER TABLE products_in_osr ADD COLUMN den_kho INTEGER"))
            print("Added column 'den_kho' to products_in_osr table")
        else:
            print("Column 'den_kho' already exists in products_in_osr table")

        await session.commit()


if __name__ == "__main__":
    asyncio.run(upgrade())
    print("Migration completed: Added tu_kho and den_kho columns to products_in_osr table")