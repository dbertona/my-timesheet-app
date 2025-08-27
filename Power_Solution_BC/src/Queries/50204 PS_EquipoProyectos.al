/// <summary>
/// Query PS_EquipoProyectos (ID 7000102).
/// </summary>
query 50204 PS_EquipoProyectos
{
    Caption = 'PS_EquipoProyectos';
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'EquipoProyectos';
    EntitySetName = 'EquipoProyectos';
    QueryType = API;

    elements
    {
        dataitem(ARBVRNJobTeam; ARBVRNJobTeam)
        {
            column(ARBVRNJobNo; ARBVRNJobNo)
            {
            }
            column(ARBVRNResourceName; ARBVRNResourceName)
            {
            }
            column(ARBVRNResourceNo; ARBVRNResourceNo)
            {
            }
        }
    }

    trigger OnBeforeOpen()
    begin

    end;
}
