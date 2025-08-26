import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCell from '../components/timesheet/ProjectCell';

it('envía navegación por teclado con Enter', () => {
  const handleKeyDown = vi.fn();
  render(
    <table><tbody><tr>
      <ProjectCell
        line={{ id: '1' }} lineIndex={0} colStyle={{}} align="left"
        editFormData={{ 1: { job_no: '' } }}
        inputRefs={{ current: {} }} hasRefs={false} setSafeRef={() => {}}
        error={null} isEditable={true}
        handlers={{ handleInputChange: () => {}, handleInputFocus: () => {}, handleKeyDown, setFieldError: () => {}, clearFieldError: () => {} }}
        jobsState={{ jobsLoaded: true, ensureTasksLoaded: async () => {}, findJob: () => null, jobs: [] }}
      />
    </tr></tbody></table>
  );
  const input = screen.getByRole('textbox');
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(handleKeyDown).toBeCalled();
});
