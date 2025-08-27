/// <summary>
/// Query PS_Centros Responsabilidad (ID 7000107).
/// </summary>
query 50200 "PS_CentrosDeResponsabilidad"
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'CentrosDeResponsabilidad';
    EntitySetName = 'CentrosDeResponsabilidad';
    QueryType = API;

    elements
    {
        dataitem(responsibilityCenter; "Responsibility Center")
        {
            column("code"; "Code")
            {
            }
            column(globalDimension1Code; "Global Dimension 1 Code")
            {
            }
            column(eMail; "E-Mail")
            {
            }
        }
    }

    trigger OnBeforeOpen()
    begin

    end;
}
