/// <summary>
/// Query PS_Proyectos_Tareas (ID 50222).
/// </summary>
query 50222 PS_Proyectos_Tareas
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'ProyectosTareas';
    EntitySetName = 'ProyectosTareas';
    QueryType = API;

    elements
    {
        dataitem(jobtask; "Job Task")
        {
            DataItemTableFilter = "Job No." = filter('<>''''');
            column(job_no; "Job No.")
            {
            }
            column(no; "Job Task No.")
            {
            }
            column(description; Description)
            {
            }
            column(lastModifiedDateTime; SystemModifiedAt)
            {
            }

            dataitem(job; Job)
            {
                DataItemLink = "No." = jobtask."Job No.";
                DataItemTableFilter = Status = filter(Open | Planning | Completed | Lost);
                column(job_status; Status)
                {
                }
            }
        }
    }

    trigger OnBeforeOpen()
    begin

    end;
}
