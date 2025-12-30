"""Initial Alembic migration example."""
# 2024-01-15_initial_schema.py
"""initial schema

Revision ID: abc123
Revises:
Create Date: 2024-01-15 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'abc123'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    """
    Upgrade schema.
    Keep migrations static and revertable.
    Don't depend on dynamic data for structure.
    """
    # Create table
    op.create_table(
        'user',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('username', sa.String(100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Create indexes
    op.create_index('user_email_idx', 'user', ['email'], unique=True)
    op.create_index('user_username_idx', 'user', ['username'], unique=True)

def downgrade():
    """
    Revert changes.
    Always ensure migrations are reversible.
    """
    op.drop_index('user_username_idx', table_name='user')
    op.drop_index('user_email_idx', table_name='user')
    op.drop_table('user')
