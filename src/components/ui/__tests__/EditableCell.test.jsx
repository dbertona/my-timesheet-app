import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EditableCell from '../EditableCell';

describe('EditableCell', () => {
  it('renders children inside cell', () => {
    render(
      <table>
        <tbody>
          <tr>
            <EditableCell>
              <input aria-label="inner-input" />
            </EditableCell>
          </tr>
        </tbody>
      </table>
    );
    expect(screen.getByLabelText('inner-input')).toBeInTheDocument();
  });

  it('applies custom className and style with align', () => {
    render(
      <table>
        <tbody>
          <tr>
            <EditableCell className="extra" style={{ width: 200 }} align="right">
              <span>content</span>
            </EditableCell>
          </tr>
        </tbody>
      </table>
    );
    const cell = screen.getByRole('cell');
    expect(cell).toHaveClass('ts-td', 'ts-cell', 'extra');
    expect(cell).toHaveStyle({ width: '200px', textAlign: 'right' });
  });

  it('renders error area when error provided', () => {
    render(
      <table>
        <tbody>
          <tr>
            <EditableCell error="Campo requerido" errorId="err-1">
              <span>content</span>
            </EditableCell>
          </tr>
        </tbody>
      </table>
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('id', 'err-1');
    expect(alert).toHaveClass('ts-inline-error');
    expect(alert).toHaveTextContent('Campo requerido');
  });

  it('does not render error when error is falsy', () => {
    render(
      <table>
        <tbody>
          <tr>
            <EditableCell error="">
              <span>content</span>
            </EditableCell>
          </tr>
        </tbody>
      </table>
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

