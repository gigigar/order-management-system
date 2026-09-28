# Order Management System

Order management for a small business that makes custom college rings, pins and dog tags for schools. It replaces the paper notebook the owners track orders in.

## Language

### Who

**Customer**:
The person who owns an Order, usually the student who will wear the item.
_Avoid_: Client, buyer, account

**Rep**:
The person who collects Orders from students at one School and deals with the business on their behalf.
_Avoid_: Agent, coordinator, contact

**School**:
The institution whose students order items. A School is not a Customer.
_Avoid_: Client, account

### Orders

**Order**:
One Customer's purchase of one or more items.
_Avoid_: Purchase, transaction, job

**Batch**:
The Orders from one School that go through production together and share one Due date.
_Avoid_: Group order, lot, run

**Due date**:
The date promised to the Customer for a Batch to be Ready.
_Avoid_: Deadline, target date

**Overdue**:
A Batch past its Due date that is not yet Ready.

**Due soon**:
A Batch whose Due date is within the next 7 days and is not yet Ready.

### Progress

**Stage**:
An internal production step an Order passes through. Only the business sees Stages.
_Avoid_: Step, phase, status

**Status**:
The coarse, public view of an Order's progress: Received, In production, Ready for pickup, Released. Each Stage maps to exactly one Status.
_Avoid_: State, stage

**Ready**:
The Status meaning the item can be picked up.
