
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Repository<User>;

  const USER_REPOSITORY_TOKEN = getRepositoryToken(User);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<Repository<User>>(USER_REPOSITORY_TOKEN);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully create a new user', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(undefined);
      jest.spyOn(usersRepository, 'create').mockReturnValue({ id: 1, ...createUserDto });
      jest.spyOn(usersRepository, 'save').mockResolvedValue({ id: 1, ...createUserDto });

      const result = await service.create(createUserDto);
      expect(result).toEqual({ id: 1, ...createUserDto });
      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { username: createUserDto.username } });
      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
      expect(usersRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(usersRepository.save).toHaveBeenCalledWith({ id: 1, ...createUserDto });
    });

    it('should throw ConflictException if username already exists', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValueOnce({ id: 1, ...createUserDto }); // Mock existing username

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createUserDto)).rejects.toThrow(`User with username "${createUserDto.username}" already exists.`);
      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { username: createUserDto.username } });
      expect(usersRepository.findOne).not.toHaveBeenCalledWith({ where: { email: createUserDto.email } }); // Should not check email if username conflicts
    });

    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(usersRepository, 'findOne')
        .mockResolvedValueOnce(undefined) // No existing username
        .mockResolvedValueOnce({ id: 1, ...createUserDto }); // Mock existing email

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createUserDto)).rejects.toThrow(`User with email "${createUserDto.email}" already exists.`);
      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { username: createUserDto.username } });
      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
      expect(usersRepository.create).not.toHaveBeenCalled();
      expect(usersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const existingUser: User = {
      id: 1,
      username: 'existinguser',
      email: 'existing@example.com',
      password: 'hashedpassword',
    };

    it('should return the user if found', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(existingUser);

      const result = await service.findOne(1);
      expect(result).toEqual(existingUser);
      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(undefined);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(`User with ID "999" not found.`);
      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
    });
  });
});
