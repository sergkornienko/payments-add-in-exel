# Payments Add-in for Excel

This is an Office Add-in designed to help with various payment-related tasks in Excel, particularly for processing medical payments, instructor payments, accruals, and audits.

## Project Structure

- `src/` - Main source code
  - `src/core/` - Core business logic, use cases, domain entities
  - `src/infra/` - Infrastructure concerns (Excel integration, DocX generation, etc.)
  - `src/ui/` - UI components for different taskpanes
  - `src/config/` - Table schemas and configuration

## Key Features

Based on the manifest.xml, this add-in provides five main functionalities accessible from the Excel ribbon:
1. **Medical Payments** (`MedicalTaskpane`) - Process medical payment statements
2. **Instructor Payments** (`InstructorsTaskpane`) - Process instructor payment statements  
3. **Summary Payments** (`SummaryTaskpane`) - View final payment summaries
4. **Accrual (70)** (`AccrualTaskpane`) - Generate accrual statements and inserts for orders
5. **Audit** (`AuditTaskpane`) - Audit functionality

## Development Commands

See `package.json` for available npm scripts:

- `npm run dev-server` - Start development server with hot reload
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm start` - Start the add-in in Excel for debugging
- `npm stop` - Stop the debugging session
- `npm test` - Run Jest tests
- `npm run lint` - Lint code with office-addin-lint
- `npm run lint:fix` - Fix linting issues
- `npm run validate` - Validate the manifest.xml

## Debugging

To debug the add-in in Excel:
1. Run `npm run dev-server` in one terminal
2. Run `npm start` in another terminal
3. Excel should launch with the add-in loaded

The add-in loads different HTML files based on the taskpane button clicked:
- medical.html
- instructors.html  
- taskpane.html (summary)
- accrual.html
- audit.html

## Technology Stack

- TypeScript
- Webpack 5
- Office JavaScript API
- Jest for testing
- ESLint with office-addin-lint plugin
- Docxtemplater and Pizzip for DOCX generation
- UUID for unique identifiers
- Zod for schema validation

## Notes

- The add-in targets Excel Desktop (Workbook host)
- Uses localhost:3005 for development server