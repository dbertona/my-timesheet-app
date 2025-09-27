/// <summary>
/// Query PS_Links (ID 50010).
/// </summary>
query 50210 PS_Links
{
    Caption = 'PS_Links';
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'Links';
    EntitySetName = 'Links';
    QueryType = API;

    elements
    {
        dataitem(recordLink; "Record Link")
        {
            column(company; Company)
            {
            }
            column(description; Description)
            {
            }
            column(linkID; "Link ID")
            {
            }
            column("recordID"; "Record ID")
            {
            }
            column("type"; "Type")
            {
            }
            column(url1; URL1)
            {
            }
            column(userID; "User ID")
            {
            }
        }
    }

    trigger OnBeforeOpen()
    begin

    end;
}
