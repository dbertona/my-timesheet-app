/// <summary>
/// Query PS_Tipologias(ID 7000106).
/// </summary>
query 50209 PS_Tipologias
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'Tipologias';
    EntitySetName = 'Tipologias';
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
        currQuery.SETFILTER(dimensionCode, 'TIPOLOGÍA')
    end;
}
