import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../pages/Login';
import axios from 'axios';

jest.mock('axios');

test('renders login form', () => {
    render(<Login />);
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
});

test('shows error on empty fields', () => {
    render(<Login />);
    fireEvent.click(screen.getByText(/Login/i));
    expect(screen.getByText(/Please fill in all fields./i)).toBeInTheDocument();
});

test('logs in successfully', async () => {
    axios.post.mockResolvedValue({ data: { user_id: 'test_user_id' } });
    render(<Login />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText(/Login/i));
    expect(await screen.findByText(/Redirecting.../i)).toBeInTheDocument();
});
