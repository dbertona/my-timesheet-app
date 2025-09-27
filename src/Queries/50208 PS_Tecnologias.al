/// <summary>
/// Query PS_Tecnologias (ID 7000104).
/// </summary>
query 50208 PS_Tecnologias
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'Tecnologias';
    EntitySetName = 'Tecnologias';
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
        currQuery.SETFILTER(dimensionCode, 'TECNOLOGÍA')
    end;
}
