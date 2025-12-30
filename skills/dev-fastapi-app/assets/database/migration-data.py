"""Migration with data modification example."""
# 2024-02-10_add_user_roles.py
"""add user roles

Revision ID: def456
Revises: abc123
Create Date: 2024-02-10 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'def456'
down_revision = 'abc123'

def upgrade():
    # Add column
    op.add_column('user', sa.Column('role', sa.String(50), nullable=True))

    # Update existing data (dynamic data, static structure)
    op.execute("UPDATE \"user\" SET role = 'member' WHERE role IS NULL")

    # Make column non-nullable after setting defaults
    op.alter_column('user', 'role', nullable=False)

    # Add check constraint
    op.create_check_constraint(
        'user_role_check',
        'user',
        "role IN ('member', 'creator', 'admin')"
    )

def downgrade():
    op.drop_constraint('user_role_check', 'user')
    op.drop_column('user', 'role')
