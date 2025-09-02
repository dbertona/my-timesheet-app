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
            column(lastModifiedDateTime; SystemModifiedAt)
            {
            }

            dataitem(job; Job)
            {
                DataItemLink = "No." = jobtask."ARBVRNJobNo";
                DataItemTableFilter = Status = filter(Open | Planning | Completed | Lost);
                dataitem(resource; Resource)
                {
                    DataItemLink = "No." = jobtask."ARBVRNResourceNo";
                    DataItemTableFilter = ARBVRNEMail = filter('*@*'), "Global Dimension 1 Code" = filter('<>''''');
                }
            }
        }
    }

    trigger OnBeforeOpen()
    begin

    end;
}
