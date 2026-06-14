# Payments Add-in for Excel

An Office Add-in designed to streamline payment-related tasks in Excel, including processing medical payments, instructor payments, accruals, and audits.

## Description

This project implements a comprehensive Excel add-in that helps organizations manage various payment workflows directly within Excel. The add-in provides specialized interfaces for:

- **Medical Payments**: Processing medical payment statements
- **Instructor Payments**: Managing instructor compensation workflows
- **Summary Payments**: Viewing and verifying final payment summaries
- **Accrual (70)**: Generating accrual statements and order inserts
- **Audit**: Auditing payment processes and data

## Architecture

We follow **Domain-Driven Design (DDD)** principles to model the complex business logic of payment processing, separating concerns into:

- **Core Domain**: Contains entities, value objects, domain services, and business rules
- **Application Layer**: Use cases that orchestrate domain objects to fulfill user goals
- **Infrastructure Layer**: External concerns like Excel integration, file generation (DocX), and data persistence
- **User Interface Layer**: Taskpanes built with HTML/TypeScript that interact with the Office.js API

Additionally, we practice **Test-Driven Development (TDD)** to ensure quality and maintainability:
- Unit tests cover domain entities, value objects, and application use cases
- Tests are written before implementation to drive design and verify correctness
- Continuous testing helps prevent regressions as the system evolves

## Domain Model

The core domain encompasses several bounded contexts reflecting different payment types:

### Key Entities
- **Serviceman**: Represents an individual receiving payments 
- **PayrollItem**: A line item in a payroll statement detailing earnings
- **Document**: Generated files such as payment statements or order inserts
- **RewardAccrual**: Calculated accrual amounts

### Important Value Objects
- **FullName**: Structured name with first, middle, last components
- **PayrollValue**: Monetary amount and precision handling
- **DateRange**: Period definition for payroll calculations
- **ComparisonDifference**: Represents variances between two payroll items

### Domain Services
- **PayrollParserService**: Parses raw input data into domain objects
- **PayrollAnalysisService**: Performs calculations and variance analysis
- **PayrollPeriodResolver**: Determines applicable payroll periods based on dates
- **RewardAccrualRenderService**: Formats accrual data for document generation

### Use Cases (Application Layer)
- **CreateMedicalPayrollUseCase**: Generates medical payment statements
- **CreateInstructorsPayrollUseCase**: Processes instructor compensation
- **CreateSummaryPayrollUseCase**: Creates consolidated payment summaries
- **CreateAuditUseCase**: Performs auditing and validation of payroll data


## Getting Started

See the `package.json` file for available scripts:
- `npm run dev-server` - Start development server
- `npm start` - Launch the add-in in Excel for debugging
- `npm test` - Run the test suite
- `npm run lint` - Check code quality

## License

MIT License