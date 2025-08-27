/// <summary>
/// Query Dias de Imputacion (ID 50012).
/// </summary>
query 50212 "Dias de Imputacion"
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'DiasdeImputacion';
    EntitySetName = 'DiasdeImputacion';
    QueryType = API;

    elements
    {
        dataitem(ARBVRNAllocationPeriodDays; ARBVRNAllocationPeriodDays)
        {
            column(Dia; ARBVRNDay)
            {
            }
            column(Festivo; ARBVRNHoliday)
            {
            }
            column(Calendario; ARBVRNCalendar)
            {
            }
            column(Imputables; ARBVRNHoursWorking)
            {
            }

        }
    }

    trigger OnBeforeOpen()
    begin

    end;
}
