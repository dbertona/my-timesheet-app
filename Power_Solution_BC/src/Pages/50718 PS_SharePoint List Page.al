/* page 50717 "PS SharePoint List Page"
{
    PageType = List;
    UsageCategory = Lists;
    ApplicationArea = All;
    SourceTableTemporary = true;
    SourceTable = "PS PowerApp";
    Caption = 'SharePoint Data';
    layout
    {
        area(content)
        {
            repeater(Group)
            {
                field(ID; Rec.ID)
                {
                    Caption = 'ID';
                }
                field(Title; Rec.Title)
                {
                    Caption = 'Title';
                }
                field(ResourceNo; Rec.ResourceNo)
                {
                    Caption = 'Resource No';
                }
                field(JobNo; Rec.JobNo)
                {
                    Caption = 'Job No';
                }
                field(JobTaskNo; Rec.JobTaskNo)
                {
                    Caption = 'Job Task No';
                }
                field(Description; Rec.Description)
                {
                    Caption = 'Description';
                }
                field(WorkType; Rec.WorkType)
                {
                    Caption = 'Work Type';
                }
                field(Date; Rec.Date)
                {
                    Caption = 'Date';
                }
                field(Quantity; Rec.Quantity)
                {
                    Caption = 'Quantity';
                }
                field(Status; Rec.Status)
                {
                    Caption = 'Status';
                }
                field(Processed; Rec.Processed)
                {
                    Caption = 'Processed';
                }
                field(JobResponsibleApproval; Rec.JobResponsibleApproval)
                {
                    Caption = 'Job Responsible Approval';
                }
                field(RejectionCause; Rec.RejectionCause)
                {
                    Caption = 'Rejection Cause';
                }
                field(JobResponsible; Rec.JobResponsible)
                {
                    Caption = 'Job Responsible';
                }
                field(ResourceResponsible; Rec.ResourceResponsible)
                {
                    Caption = 'Resource Responsible';
                }
                field(JobNoAndDescription; Rec.JobNoAndDescription)
                {
                    Caption = 'Job No and Description';
                }
                field(ResourceName; Rec.ResourceName)
                {
                    Caption = 'Resource Name';
                }
                field(Company; Rec.Company)
                {
                    Caption = 'Company';
                }
                field(Created; Rec.Created)
                {
                    Caption = 'Created Date';
                }
                field(Modified; Rec.Modified)
                {
                    Caption = 'Modified Date';
                }
            }
        }
    }
    trigger OnOpenPage()
    var
        AuthCodeunit: Codeunit "PS SharePoint Auth Call";  // Codeunit para obtener el token
        SharePointLoader: Codeunit "Ps SharePoint TimeSheet";  // Codeunit para cargar los datos de SharePoint
        Token: Text;
    begin
        // Obtener el token de autenticación de SharePoint
        Token := AuthCodeunit.AuthenticateSharePoint();

        // Verificar que se haya obtenido el token correctamente
        if Token <> '' then begin
            // Llamar al procedimiento para cargar los datos y pasar el token
            SharePointLoader.LoadSharePointData(Rec, Token);  // Pasar el registro y el token
            CurrPage.Update();  // Refrescar la página después de cargar los datos
        end else begin
            Error('No se pudo obtener el token de autenticación.');
        end;
    end;
}
 */
