import * as Yup from 'yup';
import User from '../models/User';

class UserController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed.' });
    }
    const userExists = await User.findOne({ where: { email: req.body.email } });
    if (userExists) {
      res.status(400).json({ error: 'User already exists.' });
    }

    const { id, name, email } = await User.create(req.body);
    return res.json({
      id,
      name,
      email,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string(),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed.' });
    }

    const { email, oldPassword } = req.body;
    const loggedUser = await User.findByPk(req.userId);

    if (!loggedUser) {
      return res.status(401).json({ error: 'User not logged.' });
    }

    // user wants to change email.
    if (email !== loggedUser.email) {
      const emailAlreadyInUse = await User.findOne({ where: { email } });
      if (emailAlreadyInUse) {
        return res.status(400).json({ error: 'User already exists.' });
      }
    }

    // user wants to change password.
    if (oldPassword && !(await loggedUser.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match.' });
    }

    const { name } = await loggedUser.update(req.body);
    return res.json({
      id: req.userId,
      name,
      email,
    });
  }
}

export default new UserController();
