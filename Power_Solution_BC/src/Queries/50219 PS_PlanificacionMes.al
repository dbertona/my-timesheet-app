/// <summary>
/// Query JobPlanningLine_Month (ID 50013).
/// </summary>
query 50219 PS_PlanificacionMes
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'PlanificacionMes';
    EntitySetName = 'PlanificacionMes';
    QueryType = API;
    elements
    {
        dataitem(JobTask; "Job Planning Line")
        {
            column(Job; "Job No.")
            {
            }

            column(Year; "Planning Date")
            {
                Method = Year;
            }
            column(Month; "Planning Date")
            {
                Method = Month;
            }
            column(Invoice; "Total Price (LCY)")
            {
                Method = Sum;
            }
            column(Cost; "Total Cost (LCY)")
            {
                Method = Sum;
            }
            column(Nr; "No.")
            {
            }
            column(TypeLine; "Type")
            {
            }
            column(Quantity; "Quantity")
            {
                Method = Sum;
            }
            column(LineType; "Line Type")
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
                dataitem(PS_MonthClosing; "PS_MonthClosing")
                {
                    DataItemLink = "PS_JobNo" = JobTask."Job No.";

                    SqlJoinType = LeftOuterJoin;
                    column(BudgetDateYear; PS_ClosingMonthDate)
                    {
                        Method = Year;
                    }
                    column(BudgetDateMonth; PS_ClosingMonthDate)
                    {
                        Method = Month;
                    }
                    column(Status1; PS_Status)
                    {
                    }
                    filter(Status; PS_Status)
                    {
                        ColumnFilter = Status = filter('Open');
                    }
                    dataitem(ConceptoAnalitico; "Dimension Value")
                    {
                        DataItemLink = "Code" = JobTask."ARBVRNAnaliticConcept";
                        SqlJoinType = LeftOuterJoin;
                        column(DescripcionCA; Name)
                        { }
                    }
                }
            }
        }
    }
    Var
        Type: Text[1];

    trigger OnBeforeOpen()
    begin
        Type := 'P'
    end;
}
