"""Database model naming conventions examples."""
# All lowercase with underscores
# Singular form for table names
# Consistent prefixes for related tables

class User(Base):
    __tablename__ = "user"

    id = Column(UUID(as_uuid=True), primary_key=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    email = Column(String(255))
    created_at = Column(DateTime(timezone=True))
    birth_date = Column(Date)

class Post(Base):
    __tablename__ = "post"

    id = Column(UUID(as_uuid=True), primary_key=True)
    title = Column(String(200))
    content = Column(Text)
    creator_id = Column(UUID(as_uuid=True), ForeignKey("user.id"))
    published_at = Column(DateTime(timezone=True))

class PostLike(Base):
    __tablename__ = "post_like"

    id = Column(UUID(as_uuid=True), primary_key=True)
    post_id = Column(UUID(as_uuid=True), ForeignKey("post.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"))
    created_at = Column(DateTime(timezone=True))

# Payment module - grouped with prefix
class PaymentAccount(Base):
    __tablename__ = "payment_account"

class PaymentBill(Base):
    __tablename__ = "payment_bill"

class PaymentTransaction(Base):
    __tablename__ = "payment_transaction"
