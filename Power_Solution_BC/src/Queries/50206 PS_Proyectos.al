/// <summary>
/// Query PS_Proyectos (ID 50006).
/// </summary>
query 50206 PS_Proyectos
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'Proyectos';
    EntitySetName = 'Proyectos';
    QueryType = API;

    elements
    {
        dataitem(job; Job)
        {
            column(no; "No.")
            {
            }
            column(description; Description)
            {
            }
            column(departamento; "Global Dimension 1 Code")
            {
            }
            column(Probability; "PS_% Probability")
            {
            }
            column(TipoProyecto; ARBVRNJobType)
            {
            }
            column(Estado; Status)
            {
            }
            column(Fechafin; "Ending Date")
            {
            }
            column(DoNotConsolidate; "PS_DoNotConsolidate")
            {
            }
            column(Responsible; "Person Responsible")
            {
            }
        }
    }

    trigger OnBeforeOpen()
    begin

    end;
}
