import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';
import { describe, it, expect, vi } from 'vitest';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>로그인</Button>);
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>확인</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('respects disabled', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>제출</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
