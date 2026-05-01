import { render, screen } from '@testing-library/react';
import { Pill } from '../Pill';
import { describe, it, expect } from 'vitest';

describe('Pill', () => {
  it('renders children', () => {
    render(<Pill color="teal">신청 완료</Pill>);
    expect(screen.getByText('신청 완료')).toBeInTheDocument();
  });
});
