/// <summary>
/// Query PS_ConfiguracionUsuarios (ID 7000108).
/// </summary>
query 50202 PS_ConfiguracionUsuarios
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'ConfiguracionUsuarios';
    EntitySetName = 'ConfiguracionUsuarios';
    QueryType = API;

    elements
    {
        dataitem(userSetup; "User Setup")
        {
            column(userID; "User ID")
            {
            }
            column(eMail; "E-Mail")
            {
            }
            column(arbvrnJobresponsabilityfilter; ARBVRNJobresponsabilityfilter)
            {
            }
            dataitem(CentroResponsabilidas; "Responsibility Center")
            {
                DataItemLink = "Code" = userSetup.ARBVRNJobresponsabilityfilter;
                SqlJoinType = LeftOuterJoin;
                column(Departamento; "Global Dimension 1 Code") { }
            }

        }
    }

    trigger OnBeforeOpen()
    begin

    end;
}
