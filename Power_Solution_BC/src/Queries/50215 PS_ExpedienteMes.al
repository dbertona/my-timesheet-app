/// <summary>
/// Query JobPlanningLine_Month (ID 50013).
/// </summary>
query 50215 PS_ExpedienteMes
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'ExpedienteMes';
    EntitySetName = 'ExpedienteMes';
    QueryType = API;
    elements
    {
        dataitem(Expediente; "ARBVRNJobUnitPlanning")
        {
            column(Job; "ARBVRNJobNo")
            {
            }

            column(Year; "ARBVRNPlanningDate")
            {
                Method = Year;
            }
            column(Month; "ARBVRNPlanningDate")
            {
                Method = Month;
            }
            column(Invoice; "ARBVRNCertificationAmount")
            {
                Method = Sum;
            }
            Filter(Real; "ARBVRNReal")
            {
                ColumnFilter = Real = filter(False);
            }

            dataitem(JobTabla; "Job")
            {
                DataItemLink = "No." = Expediente."ARBVRNJobNo";
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
                    DataItemLink = "PS_JobNo" = Expediente."ARBVRNJobNo";

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

                }
            }
        }
    }


    trigger OnBeforeOpen()
    begin
    end;
}
