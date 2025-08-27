/// <summary>
/// Query JobPlanningLine_Month (ID 50013).
/// </summary>
query 50220 PS_Years
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'PS_Years';
    EntitySetName = 'PS_Years';
    QueryType = API;
    elements
    {
        dataitem(JobTask; PS_Year)
        {
            column(Year; PS_Year)
            {
            }
        }
    }
}
