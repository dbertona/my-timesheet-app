/// <summary>
/// Query PS_MovimientosProyectos (ID 7000110).
/// </summary>
query 50205 PS_MovimientosProyectos
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'MovimientosProyectos';
    EntitySetName = 'MovimientosProyectos';
    QueryType = API;
    elements
    {
        dataitem(jobLedgerEntry; "Job Ledger Entry")

        {
            column(entryType; "Entry Type")
            {
            }
            column(documentNo; "Document No.")
            {
            }
            column(jobNo; "Job No.")
            {
            }
            column(jobTaskNo; "Job Task No.")
            {
            }
            column(no; "No.")
            {
            }
            column(description; Description)
            {
            }
            column(quantity; Quantity)
            {
            }
            column(originalUnitCost; "Unit Cost (LCY)")
            {
            }
            column(totalCost; "Total Cost (LCY)")
            {
            }
            column(unitPrice; "Unit Price (LCY)")
            {
            }
            column(totalPrice; "Total Price (LCY)")
            {
            }
            column(GlobalDimension2Code; "Global Dimension 2 Code")
            {
            }
            column(GlobalDimension1Code; "Global Dimension 1 Code")
            {
            }
            column(GlobalDimension5Code; "Shortcut Dimension 5 Code")
            {
            }
            column(GlobalDimension4Code; "Shortcut Dimension 4 Code")
            {
            }
            column(TimeSheetDate; "ARBVRNTimesheetdate")
            {
            }
            column(DocumentDate; "Document Date")
            {
            }
            column(Origen; "Source Code")
            {
            }
            column(LinePrice; "Line Amount (LCY)")
            {
            }
            dataitem(PS_JobLedgerEntryMonthYear; "PS_JobLedgerEntryMonthYear")
            {

                DataItemLink = "PS_JobNo." = jobLedgerEntry."Job No.", "PS_EntryNo." = jobLedgerEntry."Entry No.";
                SqlJoinType = LeftOuterJoin;
                column(Month; "PS_Month")
                {
                }
                Column(YEAR; "PS_YEAR")
                {
                }

                dataitem("ConceptoAnalitico"; "Dimension Value")
                {
                    DataItemLink = "Code" = jobLedgerEntry."Global Dimension 2 Code";
                    SqlJoinType = LeftOuterJoin;
                    column("CA"; "Dimension Code") { }
                    column(Descripcion; Name) { }
                    dataitem(DetalleProvedor; "Detailed Vendor Ledg. Entry")
                    {
                        DataItemLink = "Document No." = jobLedgerEntry."Document No.", Amount = jobLedgerEntry."Total Price";
                        SqlJoinType = LeftOuterJoin;
                        column(Ng; ARBVRNExpensesnoteno) { }

                    }
                }
            }
        }
    }

    trigger OnBeforeOpen()
    begin

    end;
}
