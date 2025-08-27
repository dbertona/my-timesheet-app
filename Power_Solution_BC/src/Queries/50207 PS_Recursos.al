/// <summary>
/// Query PS_Recursos (ID 7000109).
/// </summary>
query 50207 PS_Recursos
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'Recursos';
    EntitySetName = 'Recursos';
    QueryType = API;

    elements
    {
        dataitem(resource; Resource)
        {
            column(no; "No.")
            {
            }
            column(name; Name)
            {
            }
            column(arbvrneMail; ARBVRNEMail)
            {
            }
            column(globalDimension1Code; "Global Dimension 1 Code")
            {
            }
            column(Calendario; "ARBVRNTypeCalendar")
            {
            }
            column(FechaDeBaja; "FechaDeBaja")
            {
            }
            column(FechaDeAlta; "Employment Date")
            {
            }
            column(Subcontratacion; "ARBVRNSubcontractResource")
            {
            }
            column(Perfil; "Perfil")
            {
            }

        }
    }

    trigger OnBeforeOpen()
    begin
    end;
}
