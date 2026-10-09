# Order Management System

Order management for a small business that makes custom college rings, pins and dog tags for schools. It replaces the paper notebooks the owners and their Agents track orders in.

## Language

### Who

**Owner**:
One of the people who run the Main office and set prices, due dates and commission rules.
_Avoid_: Boss, admin, HQ

**Main office**:
The business's central office, which receives Remittances and issues receipts.
_Avoid_: HQ, head office, branch

**Staff**:
Someone who works for the Main office and handles Orders.
_Avoid_: Employee, worker

**Agent**:
The person responsible for one Area, who works with Reps, collects payments, delivers, and earns Commission.
_Avoid_: Manager, branch manager, rep

**Area**:
A location served by one Agent. It has no physical office.
_Avoid_: Branch, region, territory

**Rep**:
The person at a School (for example a class president) who collects the students' orders and pays for the Batch.
_Avoid_: Agent, coordinator, contact

**School**:
The institution whose students order items. A School has its own Design.
_Avoid_: Client, account

**Customer**:
The student an Order is for.
_Avoid_: Client, buyer, account

### Orders

**Order**:
One Customer's purchase of one or more items. Every Order is either a School order or an Individual order.
_Avoid_: Purchase, transaction, job

**School order**:
An Order that belongs to a Batch; the Rep pays for it.
_Avoid_: Bulk order, group order

**Individual order**:
An Order a student places directly, outside any Batch; the student pays for it.
_Avoid_: Walk-in, personal order

**Batch**:
The Orders and Batch items from one School that go through production together, with one Rep, one Due date and one deposit.
_Avoid_: Group order, lot, run, bulk order

**Batch item**:
Something ordered for a whole Batch rather than for one student, such as pins.
_Avoid_: Bulk item

**Design**:
A School's ring design. Some Schools get a new Design every year.
_Avoid_: Template, mold

**Ring type**:
The ring's style: megabull, superbull, bullring, semibull, men's standard, unisex or ladies.
_Avoid_: Model, style

**Face**:
What's set on top of a ring: a Stone, or the School's logo.
_Avoid_: Top, setting

**Stone**:
A gem a Customer can choose for a ring's Face, from a list the Main office keeps up to date.
_Avoid_: Gem, birthstone

**Other item**:
Anything outside rings, pins and dog tags, such as medals or plaques.
_Avoid_: Misc, extra

**Due date**:
The date promised for a Batch or Individual order to be delivered, set by an Owner.
_Avoid_: Deadline, target date

**Overdue**:
A Batch or Individual order past its Due date that is not yet Delivered.

**Due soon**:
A Batch or Individual order whose Due date is within the next 7 days and is not yet Delivered.

### Progress

**Deal stage**:
A step in agreeing a Batch with a School: meeting, design presented, agreement signed.
_Avoid_: Sales stage, phase

**Production stage**:
A step in making an item: order received, mold, casting, finishing, finalizing, ready, delivered. A Batch moves through them together; one Order can be held back (for example, a ring being redone).
_Avoid_: Step, phase, status

**Status**:
The coarse, public view of an Order's progress: Received, In production, Ready, Delivered. Each Stage maps to exactly one Status.
_Avoid_: State, stage

**Ready**:
The item is finished and waiting to be delivered.

**Delivered**:
The item is in the Customer's hands.
_Avoid_: Released, completed, picked up

### Money

**Deposit**:
The first payment, due before production. It is not refunded. Not stored separately: it is the earliest Payment.
_Avoid_: Down payment, advance

**Balance**:
What is still unpaid; the rest is due on delivery.
_Avoid_: Remaining, due amount

**Payment**:
Money a Rep or Customer pays for a Batch or Individual order.
_Avoid_: Collection, transaction

**Commission**:
What an Agent earns on an Order once it is Delivered, worked out by a Commission rule and kept from the balance they collect on delivery. Cancelled Orders earn none. When two Agents share an Order, they split it as they agree.
_Avoid_: Cut, fee, share

**Commission rule**:
How Commission is worked out for a kind of item: a percentage of the price, a flat amount per item, or the Agent's markup over the Main office's base price.
_Avoid_: Rate, scheme

**Remittance**:
Money an Agent hands over to the Main office: Payments collected, minus the Commission they keep. It counts once an Owner confirms it arrived.
_Avoid_: Handover, payout, turnover

**Amount owed**:
What an Agent still owes the Main office: Payments collected, minus Commission earned, minus confirmed Remittances.
_Avoid_: Agent balance, debt
