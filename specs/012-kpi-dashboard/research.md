# Research Notes: Role-Aware KPI Dashboard

## Decision 1: Facilities Assigned Calculation in Team Performance
* **Chosen Option**: Option A (Count all active facilities currently owned by the representative, ignoring the selected time period).
* **Rationale**: Gives managers a realistic picture of a representative's current workload at any given moment, rather than just showing new assignments within a small weekly/monthly window.
* **Alternatives Considered**: 
  * Option B: Count only facilities created within the selected time period. (Rejected because workload is cumulative, not just limited to new additions).
  * Option C: Count facilities that were reassigned/created for the rep within the period. (Rejected due to database schema limitations, since `Facility` doesn't track historical assignment timestamp logs directly on the record).

## Decision 2: Weekly Time Window Start Day
* **Chosen Option**: Option A (Sunday start).
* **Rationale**: Aligns with the Saudi Arabian and Middle Eastern business calendar where Sunday is the start of the workweek.
* **Alternatives Considered**:
  * Option B: Monday start. (Rejected because the target market for NEBRASGOO is Saudi Arabia).
