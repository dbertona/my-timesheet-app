/// <summary>
/// Query PS_Departamentos (ID 7000104).
/// </summary>
query 50203 PS_Departamentos
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'Departamentos';
    EntitySetName = 'Departamentos';
    QueryType = API;

    elements
    {
        dataitem(dimensionValue; "Dimension Value")
        {
            column("code"; "Code")
            {
            }
            filter(dimensionCode; "Dimension Code")
            {
            }
            column(name; Name)
            {
            }
        }
    }

    trigger OnBeforeOpen()
    begin
        currQuery.SETFILTER(dimensionCode, 'DPTO')
    end;
}
