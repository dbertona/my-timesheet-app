query 50217 "PS_MesesCerrados"
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'MesesCerrados';
    EntitySetName = 'MesesCerrados';
    QueryType = API;

    elements
    {
        dataitem(PS_MonthClosing; PS_MonthClosing)
        {
            column(job; PS_JobNo)
            {
            }
            column(fecha; PS_ClosingMonthDate)
            {
            }
            column(estado; PS_Status)
            {
            }
            filter(Status; PS_Status)
            {
                ColumnFilter = Status = filter('Close');
            }
            column(BillablePriceTotal; PS_BillablePriceTotal)
            {
            }
            column(CostTotal; PS_CostTotal)
            {
            }
        }
    }

    trigger OnBeforeOpen()
    begin

    end;
}
