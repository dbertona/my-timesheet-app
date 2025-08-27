/// <summary>
/// Query PS_Proyectos (ID 50006).
/// </summary>
query 50223 PS_Proyectos_Equipo
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'ProyectosEquipos';
    EntitySetName = 'ProyectosEquipos';
    QueryType = API;

    elements
    {
        dataitem(jobtask; "ARBVRNJobTeam")
        {
            column(job_no; "ARBVRNJobNo")
            {
            }
            column(resource_no; "ARBVRNResourceNo")
            {
            }
        }
    }

    trigger OnBeforeOpen()
    begin

    end;
}
