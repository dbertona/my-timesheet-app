query 50221 "PS_HistoricoPlanificacionMes"
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'HistoricoPlanificacionMes';
    EntitySetName = 'HistoricoPlanificacionMes';
    QueryType = API;

    elements
    {
        dataitem(JobTask; "PS_JobPlanningUnified")
        {
            column(Job; PS_JobNo) { }
            column(Year; PS_PlanningDate) { Method = Year; }
            column(Month; PS_PlanningDate) { Method = Month; }
            column(ClosingMonthCode; PS_ClosingMonthCode) { }

            column(Invoice; "PS_ProbabilizedPrice(LCY)") { Method = Sum; }
            column(Cost; "PS_ProbabilizedCost(LCY)") { Method = Sum; }

            dataitem(JobTabla; "Job")
            {
                DataItemLink = "No." = JobTask.PS_JobNo;
                SqlJoinType = LeftOuterJoin;

                column(Departamento; "Global Dimension 1 Code") { }
                column(Descripcion; Description) { }
                column(Estado; Status) { }
                column(TipoProyecto; ARBVRNJobType) { }
                column(probability; "PS_% Probability") { }

                dataitem(PS_MonthClosing; "PS_MonthClosing")
                {
                    DataItemLink =
                        "PS_JobNo" = JobTask.PS_JobNo,
                        "PS_ClosingMonthCode" = JobTask.PS_ClosingMonthCode;
                    SqlJoinType = InnerJoin;

                    column(Status1; PS_Status) { }

                    filter(Status; PS_Status)
                    {
                        ColumnFilter = Status = filter('Close');
                    }
                }
            }
        }
    }

    var
        Type: Text[1];

    trigger OnBeforeOpen()
    begin
        Type := 'P';
    end;
}
