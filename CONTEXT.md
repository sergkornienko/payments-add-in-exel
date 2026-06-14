# Payroll

A system for tracking and calculating monetary compensation for servicemen based on service periods. The context covers payroll calculation, date overlap detection, reward accrual, and document generation.

## Language

### Participants

**Serviceman**:
A military person who receives monetary compensation for service.
_Avoid_: Employee, person, user, soldier

### Payroll

**PayrollItem**:
A compensation record for a specific serviceman covering one or more date ranges.
_Avoid_: Salary, payment, record

**PayrollDays**:
A structure that stores the number of payable days broken down by month and year.
_Avoid_: Days map, salary days

**DateRange**:
A start-to-end time segment within a single `PayrollItem` for which compensation is calculated.
_Avoid_: Period, interval, timespan

**RewardAccrual**:
An aggregate that combines payroll items and orders for a single serviceman and computes remaining days and the number of paid periods.
_Avoid_: Bonus, reward, accrual record

### Analysis & Processing

**OverlapResult**:
The outcome of detecting date intersections across a serviceman's payroll items — contains the overlapping dates and a reference to the `Serviceman`.
_Avoid_: Conflict, collision, duplicate

**PayrollPeriodResolver**:
A service that splits raw payroll data into normalized monthly ranges and groups them into `PayrollItem` collections.
_Avoid_: Period calculator, range splitter

**PayrollAnalysisService**:
A service that aggregates dates across all payroll items, detects overlaps, and returns a collection of `OverlapResult`.
_Avoid_: Validation service, conflict detector

**PayrollParserService**:
A service that transforms raw input data into a collection of `PayrollItem`.
_Avoid_: Importer, transformer, mapper

### Documents & Rendering

**Document**:
A template-based document (e.g. a participation certificate) generated from `Serviceman` data.
_Avoid_: File, certificate, report

**RewardAccrualRenderService**:
A service that converts `RewardAccrual` aggregates into structures suitable for rendering reports and documents.
_Avoid_: Report generator, formatter, presenter
