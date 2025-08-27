/// <summary>
/// Query PS_ConceptosAnaliticos (ID 7000106).
/// </summary>
query 50201 PS_ConceptosAnaliticos
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'ConceptosAnaliticos';
    EntitySetName = 'ConceptosAnaliticos';
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
        currQuery.SETFILTER(dimensionCode, 'CA')
    end;
}
