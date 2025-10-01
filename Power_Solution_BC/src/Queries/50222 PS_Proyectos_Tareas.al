/// <summary>
/// Query PS_Proyectos (ID 50006).
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
            column(ARBVRNTimeSheetBlocked; ARBVRNTimeSheetBlocked)
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
