/// <summary>
/// Query JobPlanningLine_Month (ID 50013).
/// </summary>
query 50214 PS_MovimientosProyectosMes
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'MovimientosProyectosMes';
    EntitySetName = 'MovimientosProyectosMes';
    QueryType = API;
    elements
    {
        dataitem(JobTask; "Job Ledger Entry")
        {
            //DataItemTableFilter = "Entry Type" = FILTER('Sale');
            column(Job; "Job No.")
            {
            }

            column(DocumenDay; "Document Date")
            {
                //Method = Year;
            }
            column(WorkDay; "ARBVRNTimesheetdate")
            {
                //Method = Month;
            }
            column(Invoice; "Line Amount (LCY)")
            {
            }
            column(Cost; "Total Cost (LCY)")
            {

            }
            column(Quantity; "Quantity")
            {
            }
            column(LineType; "Line Type")
            {
            }
            column(Nr; "No.")
            {
            }
            column(TypeLine; "Type")
            {
            }
            column(DocumentNo; "Document No.")
            {
            }
            dataitem(JobTabla; "Job")
            {
                DataItemLink = "No." = JobTask."Job No.";
                SqlJoinType = LeftOuterJoin;
                column(Departamento; "Global Dimension 1 Code")
                {
                }
                column(Descripcion; Description)
                {
                }
                column(Estado; Status)
                {
                }
                column(TipoProyecto; ARBVRNJobType)
                {
                }
                column(probability; "PS_% Probability")
                {
                }
                column(DoNotConsolidate; PS_DoNotConsolidate)
                {
                }
                dataitem(PS_JobLedgerEntryMonthYear; "PS_JobLedgerEntryMonthYear")
                {

                    DataItemLink = "PS_JobNo." = JobTask."Job No.", "PS_EntryNo." = JobTask."Entry No.";
                    SqlJoinType = LeftOuterJoin;
                    column(Month; "PS_Month")
                    {
                    }
                    Column(YEAR; "PS_YEAR")
                    {
                    }
                    dataitem(PS_MonthClosing; "PS_MonthClosing")
                    {
                        DataItemLink = "PS_JobNo" = JobTask."Job No.", PS_Month = PS_JobLedgerEntryMonthYear.PS_Month, PS_Year = PS_JobLedgerEntryMonthYear.PS_Year;
                        SqlJoinType = LeftOuterJoin;
                        column(Status1; PS_Status)
                        {
                        }
                        filter(Status; PS_Status)
                        {
                            ColumnFilter = Status = filter('Close');
                        }
                        dataitem(ConceptoAnalitico; "Dimension Value")
                        {
                            DataItemLink = "Code" = JobTask."Global Dimension 2 Code";
                            SqlJoinType = LeftOuterJoin;
                            column(CodigoCA; Code)
                            { }
                            column(DescripcionCA; Name)
                            { }
                        }
                    }
                }
            }
        }
    }


    trigger OnBeforeOpen()
    begin
    end;
}
