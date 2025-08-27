import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCell from '../components/timesheet/ProjectCell';

it('escribe en proyecto y abre dropdown con Alt+ArrowDown', () => {
  render(
    <table><tbody><tr>
      <ProjectCell
        line={{ id: '1' }} lineIndex={0} colStyle={{}} align="left"
        editFormData={{ 1: { job_no: '' } }}
        inputRefs={{ current: {} }} hasRefs={false} setSafeRef={() => {}}
        error={null} isEditable={true}
        handlers={{ handleInputChange: () => {}, handleInputFocus: () => {}, handleKeyDown: () => {}, setFieldError: () => {}, clearFieldError: () => {} }}
        jobsState={{ jobsLoaded: true, ensureTasksLoaded: async () => {}, findJob: () => null, jobs: [{ no:'P001', description:'Demo' }] }}
      />
    </tr></tbody></table>
  );
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'P' } });
  fireEvent.keyDown(input, { key: 'ArrowDown', altKey: true });
  // Verifica que aparece el contenedor del dropdown
  expect(document.querySelector('.ts-dropdown')).toBeInTheDocument();
});
