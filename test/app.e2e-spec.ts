import { Test } from '@nestjs/testing';
import { request, spec } from 'pactum';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto/edit-user.dto';

describe('App E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDB();

    request.setBaseUrl('http://localhost:3333');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Module', () => {
    const dto: AuthDto = {
      email: 'test@test.com',
      password: 'p@ssword',
    };

    describe('Signup', () => {
      it('Should not Signup without email', () => {
        return spec()
          .post('/auth/signup')
          .withBody(dto.password)
          .expectStatus(400);
      });
    });

    describe('Signup', () => {
      it('Should not Signup without password', () => {
        return spec()
          .post('/auth/signup')
          .withBody(dto.email)
          .expectStatus(400);
      });
    });

    describe('Signup', () => {
      it('Should not Signup without body', () => {
        return spec().post('/auth/signup').expectStatus(400);
      });
    });

    describe('Signup', () => {
      it('Should Signup', () => {
        return spec().post('/auth/signup').withBody(dto).expectStatus(201);
      });
    });

    describe('Signin', () => {
      it('Should not Signin without email', () => {
        return spec()
          .post('/auth/signin')
          .withBody(dto.password)
          .expectStatus(400);
      });
    });

    describe('Signin', () => {
      it('Should not Signin without password', () => {
        return spec()
          .post('/auth/signin')
          .withBody(dto.email)
          .expectStatus(400);
      });
    });

    describe('Signin', () => {
      it('Should not Signin without body', () => {
        return spec().post('/auth/signin').expectStatus(400);
      });
    });

    describe('Signin', () => {
      it('Should Signin', () => {
        return spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAccessToken', 'access_token');
      });
    });
  });

  describe('User Module', () => {
    const userDto: EditUserDto = {
      email: 'test@user.com',
      firstName: 'Test',
    };

    describe('Get me', () => {
      it('Should get current user', () => {
        return spec()
          .get('/users/me')
          .withHeaders('Authorization', 'Bearer $S{userAccessToken}')
          .expectStatus(200);
      });
    });

    describe('Edit user', () => {
      it('Should edit user', () => {
        return spec()
          .patch('/users')
          .withHeaders('Authorization', 'Bearer $S{userAccessToken}')
          .withBody(userDto)
          .expectStatus(200)
          .expectBodyContains(userDto.email)
          .expectBodyContains(userDto.firstName);
      });
    });
  });
});
